<?php

require_once "config.php";
require_once "helpers/directline.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

// Validate that this is a POST request with a JSON body.
// If not, respond with an HTTP 400 and a JSON error. This prevents PHP
// warnings later when the code assumes $data is an array.
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !is_array($data)) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(["error" => "Invalid or missing JSON body"]);
    exit;
}

// Keep leader behavior for first turn defaults while preserving validation.
$message = $data['message'] ?? "start";
$email = $data['email'] ?? null;
$name = $data['name'] ?? null;
$role = $data['role'] ?? "user";

if (!$email || !$name) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields: email and name"]);
    exit;
}

$conversationId = $data['conversationId'] ?? null;
$watermark = $data['watermark'] ?? null;

/* -----------------------------
NEW conversation OR existing
------------------------------*/

if (!$conversationId) {
    logMessage("Starting new conversation");

    $result = startConversationFlow(null, $message, $email, $name, $role);

    // IMPORTANT: update conversationId from start flow
    $conversationId = $result['conversationId'] ?? null;
    $watermark = $result['reply']['watermark'] ?? null;
    $response = $result['reply'] ?? ["messages" => [], "actions" => [], "watermark" => null];
} else {
    logMessage("Send Msg");

    $isStartTurn = strtolower(trim((string)$message)) === 'start';

    $result = sendMessageToCopilot(
        $conversationId,
        $message,
        $email,
        $name,
        $role
    );

    // Keep expired-conversation recovery to avoid regressions.
    if (!empty($result['expired'])) {
        $restart = startConversationFlow(null, $message, $email, $name, $role);
        $conversationId = $restart['conversationId'] ?? $conversationId;
        $watermark = $restart['reply']['watermark'] ?? null;
        $response = $restart['reply'] ?? ["messages" => [], "actions" => [], "watermark" => null];
    } else {
        $response = waitForBotMessages($conversationId, $watermark, $isStartTurn);
    }
}


/* -----------------------------
Return structured response
------------------------------*/

echo json_encode([
    "conversationId" => $conversationId,
    "watermark" => $response['watermark'] ?? $watermark,
    "messages" => $response['messages'],
    "actions" => $response['actions']
    // "attachments" => $response['attachments']
]);
