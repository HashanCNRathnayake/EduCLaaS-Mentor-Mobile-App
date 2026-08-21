<?php

function logRaw($type, $data)
{
    $log = [
        "time" => date("Y-m-d H:i:s"),
        "type" => $type,
        "data" => $data
    ];

    file_put_contents(
        "directline-raw.log",
        json_encode($log, JSON_PRETTY_PRINT) . PHP_EOL,
        FILE_APPEND
    );
}

function logMessage($msg)
{
    logRaw("MESSAGE", ["message" => $msg]);
}

function createConversation()
{

    $url = DIRECTLINE_ENDPOINT . "/conversations";

    logRaw("REQUEST_CREATE_CONVERSATION", [
        "url" => $url
    ]);


    $ch = curl_init($url);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);

    $headers = [
        "Authorization: Bearer " . DIRECTLINE_SECRET,
        "Content-Type: application/json"
    ];

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response = curl_exec($ch);

    logRaw("RESPONSE_CREATE_CONVERSATION", $response);


    curl_close($ch);

    return json_decode($response, true);
}

function startConversationFlow($conversationId, $message, $email, $name, $role)
{
    logMessage("func start conv");

    $conversation = createConversation();
    $conversationId = $conversation['conversationId'] ?? null;

    if (!$conversationId) {
        logRaw("START_CONVERSATION_FAILED", ["conversation" => $conversation]);
        return [
            "conversationId" => null,
            "token" => null,
            "response_sendmsg" => ["error" => ["code" => "ConversationCreateFailed"]],
            "reply" => ["messages" => [], "actions" => [], "watermark" => null]
        ];
    }

    $sendResult = sendMessageToCopilot($conversationId, $message, $email, $name, $role);

    // Keep conversation recovery even on new-conversation flow.
    if (!empty($sendResult['expired'])) {
        $conversation = createConversation();
        $conversationId = $conversation['conversationId'] ?? null;

        if ($conversationId) {
            $sendResult = sendMessageToCopilot($conversationId, $message, $email, $name, $role);
        }
    }

    $reply = $conversationId
        ? waitForBotMessages($conversationId, null, true)
        : ["messages" => [], "actions" => [], "watermark" => null];

    return [
        "conversationId" => $conversationId,
        "token" => $conversation['token'] ?? null,
        "response_sendmsg" => $sendResult['response'] ?? null,
        "reply" => $reply
    ];
}



function sendMessageToCopilot($conversationId, $message, $email, $name, $role)
{

    $url = DIRECTLINE_ENDPOINT . "/conversations/" . $conversationId . "/activities";

    $payload = [
        "type" => "message",
        "from" => [
            "id" => $email,
            "name" => $name
        ],
        "text" => $message,
        "channelData" => [
            "systemActivityFromEmail" => $email,
            "email" => $email,
            "name" => $name,
            "role" => $role
        ]
    ];

    logRaw("REQUEST_SEND_MESSAGE", [
        "url" => $url,
        "payload" => $payload
    ]);

    $ch = curl_init($url);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);

    $headers = [
        "Authorization: Bearer " . DIRECTLINE_SECRET,
        "Content-Type: application/json"
    ];

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

    $response = curl_exec($ch);
    logRaw("RESPONSE_SEND_MESSAGE", $response);

    curl_close($ch);

    $data = json_decode($response, true);

    /* Detect expired conversation */


    logRaw("RESPONSE_SEND_MESSAGE_data", $data);

    $expired = false;

    if (isset($data['error'])) {

        if (
            $data['error']['code'] == "ConversationNotFound" ||
            $data['error']['code'] == "BadArgument"
        ) {
            $expired = true;
        }
    }

    return [
        "expired" => $expired,
        "response" => $data
    ];
}


function getBotReply($conversationId, $watermark = null)
{

    $url = DIRECTLINE_ENDPOINT . "/conversations/" . $conversationId . "/activities";

    if ($watermark !== null && $watermark !== '') {
        $url .= "?watermark=" . urlencode((string)$watermark);
    }

    logRaw("REQUEST_GET_REPLY", [
        "url" => $url
    ]);

    $ch = curl_init($url);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $headers = [
        "Authorization: Bearer " . DIRECTLINE_SECRET
    ];

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response = curl_exec($ch);

    logRaw("RESPONSE_GET_REPLY", $response);

    curl_close($ch);

    $data = json_decode($response, true);
    file_put_contents('dl-debug.json', json_encode($data, JSON_PRETTY_PRINT));

    $messages = [];
    $actions = [];

    if (isset($data['activities'])) {

        foreach ($data['activities'] as $activity) {

            if (($activity['from']['role'] ?? '') === "bot") {

                /* BOT TEXT */

                if (!empty($activity['text'])) {

                    $messages[] = [
                        "type" => "text",
                        "content" => $activity['text']
                    ];
                }
                /* SUGGESTED ACTIONS */

                if (!empty($activity['suggestedActions']['actions'])) {

                    foreach ($activity['suggestedActions']['actions'] as $action) {

                        $actions[] = $action;
                    }
                }
            }
        }
    }

    return [
        "messages" => $messages,
        "actions" => $actions,
        "watermark" => $data['watermark'] ?? $watermark,
    ];
}

function waitForBotMessages($conversationId, $watermark = null, $isStart = false)
{
    $currentWatermark = $watermark;
    $reply = ["messages" => [], "actions" => [], "watermark" => $watermark];
    $seenMessages = [];
    $seenActions = [];
    $idlePolls = 0;
    $maxPolls = $isStart ? 35 : 12;

    // Leader request for START: wait before pulling so delayed chunks are included.
    if ($isStart) {
        sleep(10);
    }

    for ($i = 0; $i < $maxPolls; $i++) {

        $pollReply = getBotReply($conversationId, $currentWatermark);
        $foundNewData = false;

        if (!empty($pollReply['messages'])) {
            foreach ($pollReply['messages'] as $message) {
                $content = trim($message['content'] ?? '');

                if ($content === '') {
                    continue;
                }

                if (!in_array($content, $seenMessages, true)) {
                    $seenMessages[] = $content;
                    $reply['messages'][] = $message;
                    $foundNewData = true;
                }
            }
        }

        if (!empty($pollReply['actions'])) {
            foreach ($pollReply['actions'] as $action) {
                $actionKey = json_encode($action);

                if ($actionKey === false) {
                    continue;
                }

                if (!in_array($actionKey, $seenActions, true)) {
                    $seenActions[] = $actionKey;
                    $reply['actions'][] = $action;
                    $foundNewData = true;
                }
            }
        }

        if (isset($pollReply['watermark']) && $pollReply['watermark'] !== null) {
            $currentWatermark = $pollReply['watermark'];
            $reply['watermark'] = $currentWatermark;
        }

        if ($foundNewData) {
            $idlePolls = 0;
        } else {
            $idlePolls++;
        }

        // For start flow, keep collecting until stream settles after actions/chunks.
        if ($isStart && !empty($reply['actions']) && $idlePolls >= 2) {
            break;
        }

        // For normal turns, keep prior quick behavior once we got a response.
        if (!$isStart && (!empty($reply['messages']) || !empty($reply['actions']))) {
            break;
        }

        sleep(1);
    }

    return $reply;
}
