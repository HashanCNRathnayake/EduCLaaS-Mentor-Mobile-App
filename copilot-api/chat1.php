<?php

require_once "config.php";
require_once "helpers/directline.php";

header('Content-Type: application/json');


// ============================================================
// 1. GET FRONTEND VARIABLES
// ============================================================

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        "error" => "Invalid JSON body"
    ]);

    exit;
}


$message        = trim($data["message"] ?? "");
$email          = trim($data["email"] ?? "");
$name           = trim($data["name"] ?? "");
$role           = trim($data["role"] ?? "");
$conversationId = $data["conversationId"] ?? null;
$watermark      = $data["watermark"] ?? null;


// Basic validation
if ($message === "") {
    http_response_code(400);

    echo json_encode([
        "error" => "Message is required"
    ]);

    exit;
}


if ($email === "") {
    http_response_code(400);

    echo json_encode([
        "error" => "Email is required"
    ]);

    exit;
}


// ============================================================
// 2. DIRECT LINE SETTINGS
// ============================================================

$directLineSecret = DIRECTLINE_SECRET;

$baseUrl = "https://directline.botframework.com/v3/directline";


// ============================================================
// 3. DIRECT LINE CURL FUNCTION
// ============================================================

function callDirectLine($url, $method, $token, $body = null)
{
    $ch = curl_init($url);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 35);

    $headers = [
        "Authorization: Bearer " . $token,
        "Content-Type: application/json"
    ];

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);


    if ($method === "POST") {

        curl_setopt($ch, CURLOPT_POST, true);

        if ($body !== null) {
            curl_setopt(
                $ch,
                CURLOPT_POSTFIELDS,
                json_encode($body)
            );
        }
    }


    $response = curl_exec($ch);

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);


    if ($response === false) {

        $error = curl_error($ch);

        curl_close($ch);

        return [
            "error" => $error,
            "httpCode" => $httpCode
        ];
    }


    curl_close($ch);


    $decoded = json_decode($response, true);


    if ($decoded === null && $response !== "") {

        return [
            "error" => "Invalid JSON response from Direct Line",
            "raw" => $response,
            "httpCode" => $httpCode
        ];
    }


    if ($httpCode >= 400) {

        return [
            "error" => "Direct Line returned HTTP " . $httpCode,
            "response" => $decoded,
            "httpCode" => $httpCode
        ];
    }


    return $decoded ?? [];
}


// ============================================================
// 4. HELPER: CHECK IF TEXT ALREADY CONTAINS HTML
// ============================================================

function containsHtml($text)
{
    if (!is_string($text)) {
        return false;
    }

    return preg_match('/<\s*(table|thead|tbody|tr|td|th|div|p|ol|ul|li|h1|h2|h3|h4|h5|h6|a|br|strong|b|em|i)\b/i', $text) === 1;
}


// ============================================================
// 5. HELPER: ESCAPE NORMAL TEXT FOR HTML
// ============================================================

function escapeHtmlText($text)
{
    return htmlspecialchars(
        $text,
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8'
    );
}


// ============================================================
// 6. HELPER: CONVERT NEW LINES
// ============================================================

function formatPlainText($text)
{
    return nl2br(escapeHtmlText($text));
}


// ============================================================
// 7. TEXTBLOCK → HTML
// ============================================================

function textBlockToHtml($element)
{
    $text = $element["text"] ?? "";

    if ($text === "") {
        return "";
    }


    // --------------------------------------------------------
    // If Copilot already returned HTML, keep it
    // --------------------------------------------------------

    if (containsHtml($text)) {

        return $text;
    }


    $safeText = formatPlainText($text);


    $size   = strtolower($element["size"] ?? "");
    $weight = strtolower($element["weight"] ?? "");
    $color  = strtolower($element["color"] ?? "");


    // --------------------------------------------------------
    // Large headings
    // --------------------------------------------------------

    if ($size === "extralarge") {

        return "<h1>" . $safeText . "</h1>";
    }


    if ($size === "large") {

        return "<h2>" . $safeText . "</h2>";
    }


    if ($size === "medium" && $weight === "bolder") {

        return "<h3>" . $safeText . "</h3>";
    }


    // --------------------------------------------------------
    // Bold TextBlocks
    // --------------------------------------------------------

    if ($weight === "bolder") {

        if ($color === "accent") {

            return '<p><strong>' . $safeText . '</strong></p>';
        }


        if ($color === "good") {

            return '<p><strong>' . $safeText . '</strong></p>';
        }


        if ($color === "warning") {

            return '<p><strong>' . $safeText . '</strong></p>';
        }


        return '<p><strong>' . $safeText . '</strong></p>';
    }


    // --------------------------------------------------------
    // Normal text
    // --------------------------------------------------------

    return "<p>" . $safeText . "</p>";
}


// ============================================================
// 8. IMAGE → HTML
// ============================================================

function imageToHtml($element)
{
    $url = $element["url"] ?? "";

    if ($url === "") {
        return "";
    }


    $safeUrl = htmlspecialchars(
        $url,
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8'
    );


    $altText = htmlspecialchars(
        $element["altText"] ?? "Image",
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8'
    );


    return '<img src="' .
        $safeUrl .
        '" alt="' .
        $altText .
        '" style="max-width:100%;height:auto;" />';
}


// ============================================================
// 9. ACTION → NORMAL FRONTEND FORMAT
// ============================================================

function normalizeAction($action)
{
    $type  = $action["type"] ?? "";
    $title = $action["title"] ?? "";


    // --------------------------------------------------------
    // Open URL
    // --------------------------------------------------------

    if ($type === "Action.OpenUrl") {

        return [
            "type" => "openUrl",
            "title" => $title,
            "value" => $action["url"] ?? ""
        ];
    }


    // --------------------------------------------------------
    // Submit
    // --------------------------------------------------------

    if ($type === "Action.Submit") {

        return [
            "type" => "submit",
            "title" => $title,
            "value" => $action["data"] ?? null
        ];
    }


    // --------------------------------------------------------
    // Execute
    // --------------------------------------------------------

    if ($type === "Action.Execute") {

        return [
            "type" => "execute",
            "title" => $title,
            "value" => $action["data"] ?? null,
            "verb" => $action["verb"] ?? null
        ];
    }


    // --------------------------------------------------------
    // ShowCard
    // --------------------------------------------------------

    if ($type === "Action.ShowCard") {

        return [
            "type" => "showCard",
            "title" => $title,
            "value" => $action["card"] ?? null
        ];
    }


    return [
        "type" => $type,
        "title" => $title,
        "value" => $action["value"] ?? null
    ];
}


// ============================================================
// 10. RECURSIVELY PARSE ADAPTIVE CARD ELEMENTS
// ============================================================

function parseAdaptiveElement($element, &$actions)
{
    if (!is_array($element)) {
        return "";
    }


    $type = $element["type"] ?? "";


    // --------------------------------------------------------
    // TextBlock
    // --------------------------------------------------------

    if ($type === "TextBlock") {

        return textBlockToHtml($element);
    }


    // --------------------------------------------------------
    // RichTextBlock
    // --------------------------------------------------------

    if ($type === "RichTextBlock") {

        $html = "<p>";


        foreach ($element["inlines"] ?? [] as $inline) {

            $text = escapeHtmlText(
                $inline["text"] ?? ""
            );


            if (
                isset($inline["fontWeight"]) &&
                strtolower($inline["fontWeight"]) === "bolder"
            ) {

                $text = "<strong>" . $text . "</strong>";
            }


            if (
                isset($inline["italic"]) &&
                $inline["italic"] === true
            ) {

                $text = "<em>" . $text . "</em>";
            }


            $html .= $text;
        }


        $html .= "</p>";


        return $html;
    }


    // --------------------------------------------------------
    // Image
    // --------------------------------------------------------

    if ($type === "Image") {

        return imageToHtml($element);
    }


    // --------------------------------------------------------
    // Container
    // --------------------------------------------------------

    if ($type === "Container") {

        $innerHtml = "";


        foreach ($element["items"] ?? [] as $item) {

            $innerHtml .= parseAdaptiveElement(
                $item,
                $actions
            );
        }


        if ($innerHtml === "") {
            return "";
        }


        return '<div class="adaptive-container">' .
            $innerHtml .
            '</div>';
    }


    // --------------------------------------------------------
    // ColumnSet
    // --------------------------------------------------------

    if ($type === "ColumnSet") {

        $innerHtml = '<div class="adaptive-column-set">';


        foreach ($element["columns"] ?? [] as $column) {

            $innerHtml .= '<div class="adaptive-column">';


            foreach ($column["items"] ?? [] as $item) {

                $innerHtml .= parseAdaptiveElement(
                    $item,
                    $actions
                );
            }


            $innerHtml .= '</div>';
        }


        $innerHtml .= '</div>';


        return $innerHtml;
    }


    // --------------------------------------------------------
    // FactSet
    // --------------------------------------------------------

    if ($type === "FactSet") {

        $html = "<table>";


        foreach ($element["facts"] ?? [] as $fact) {

            $title = escapeHtmlText(
                $fact["title"] ?? ""
            );

            $value = escapeHtmlText(
                $fact["value"] ?? ""
            );


            $html .=
                "<tr>" .
                "<th>" . $title . "</th>" .
                "<td>" . $value . "</td>" .
                "</tr>";
        }


        $html .= "</table>";


        return $html;
    }


    // --------------------------------------------------------
    // ImageSet
    // --------------------------------------------------------

    if ($type === "ImageSet") {

        $html = "";


        foreach ($element["images"] ?? [] as $image) {

            $html .= imageToHtml($image);
        }


        return $html;
    }


    // --------------------------------------------------------
    // ActionSet
    // --------------------------------------------------------

    if ($type === "ActionSet") {

        foreach ($element["actions"] ?? [] as $action) {

            $actions[] = normalizeAction($action);
        }


        return "";
    }


    // --------------------------------------------------------
    // Unknown element:
    // try nested items if they exist
    // --------------------------------------------------------

    $html = "";


    if (isset($element["items"]) && is_array($element["items"])) {

        foreach ($element["items"] as $item) {

            $html .= parseAdaptiveElement(
                $item,
                $actions
            );
        }
    }


    return $html;
}


// ============================================================
// 11. PARSE COMPLETE ADAPTIVE CARD
// ============================================================

function parseAdaptiveCard($card, &$actions)
{
    if (!is_array($card)) {
        return "";
    }


    $html = "";


    // --------------------------------------------------------
    // Card body
    // --------------------------------------------------------

    foreach ($card["body"] ?? [] as $element) {

        $html .= parseAdaptiveElement(
            $element,
            $actions
        );
    }


    // --------------------------------------------------------
    // Card-level actions
    // --------------------------------------------------------

    foreach ($card["actions"] ?? [] as $action) {

        $actions[] = normalizeAction($action);
    }


    return $html;
}


// ============================================================
// 12. PARSE SUGGESTED ACTIONS
// ============================================================

function parseSuggestedActions($suggestedActions, &$actions)
{
    if (
        !isset($suggestedActions["actions"]) ||
        !is_array($suggestedActions["actions"])
    ) {
        return;
    }


    foreach ($suggestedActions["actions"] as $action) {

        $type = $action["type"] ?? "";

        $title = $action["title"]
            ?? $action["text"]
            ?? $action["value"]
            ?? "";


        if (
            $type === "imBack" ||
            $type === "messageBack"
        ) {

            $actions[] = [
                "type" => $type,
                "title" => $title,
                "value" => $action["value"]
                    ?? $action["text"]
                    ?? $title
            ];

            continue;
        }


        if ($type === "openUrl") {

            $actions[] = [
                "type" => "openUrl",
                "title" => $title,
                "value" => $action["value"] ?? ""
            ];

            continue;
        }


        $actions[] = [
            "type" => $type,
            "title" => $title,
            "value" => $action["value"]
                ?? $action["text"]
                ?? null
        ];
    }
}


// ============================================================
// 13. REMOVE DUPLICATE ACTIONS
// ============================================================

function removeDuplicateActions($actions)
{
    $unique = [];
    $seen = [];


    foreach ($actions as $action) {

        $key = md5(json_encode([
            $action["type"] ?? "",
            $action["title"] ?? "",
            $action["value"] ?? null
        ]));


        if (!isset($seen[$key])) {

            $seen[$key] = true;

            $unique[] = $action;
        }
    }


    return $unique;
}


// ============================================================
// 14. START / REUSE DIRECT LINE CONVERSATION
// ============================================================

$token = $directLineSecret;


if (empty($conversationId)) {

    $startResponse = callDirectLine(
        $baseUrl . "/conversations",
        "POST",
        $directLineSecret
    );


    if (!isset($startResponse["conversationId"])) {

        http_response_code(500);

        echo json_encode([
            "error" => "Could not start conversation",
            "directLineResponse" => $startResponse
        ]);

        exit;
    }


    $conversationId = $startResponse["conversationId"];


    // Use conversation token for this request
    if (!empty($startResponse["token"])) {

        $token = $startResponse["token"];
    }
}


// ============================================================
// 15. SEND USER MESSAGE
// ============================================================

$activity = [

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


$sendResponse = callDirectLine(
    $baseUrl .
        "/conversations/" .
        $conversationId .
        "/activities",

    "POST",

    $token,

    $activity
);


if (isset($sendResponse["error"])) {

    http_response_code(500);

    echo json_encode([
        "error" => "Could not send message",
        "details" => $sendResponse
    ]);

    exit;
}


// ============================================================
// 16. WAIT FOR COMPLETE BOT RESPONSE
// ============================================================

$allActivities = [];

$currentWatermark = $watermark;


// Maximum total wait
$maxWaitSeconds = 30;


// Check once every second
$pollInterval = 1;


// After bot starts replying,
// wait until nothing new arrives for 2 seconds
$settleSeconds = 2;


$startTime = time();

$lastNewActivityTime = null;

$botResponseReceived = false;


while ((time() - $startTime) < $maxWaitSeconds) {


    // --------------------------------------------------------
    // Build GET URL
    // --------------------------------------------------------

    $getUrl =
        $baseUrl .
        "/conversations/" .
        $conversationId .
        "/activities";


    if (
        $currentWatermark !== null &&
        $currentWatermark !== ""
    ) {

        $getUrl .=
            "?watermark=" .
            urlencode($currentWatermark);
    }


    // --------------------------------------------------------
    // Get activities
    // --------------------------------------------------------

    $activitiesResponse = callDirectLine(
        $getUrl,
        "GET",
        $token
    );


    if (isset($activitiesResponse["error"])) {

        http_response_code(500);

        echo json_encode([
            "error" => "Failed to get activities",
            "details" => $activitiesResponse
        ]);

        exit;
    }


    $newActivities =
        $activitiesResponse["activities"] ?? [];


    // --------------------------------------------------------
    // New activities arrived
    // --------------------------------------------------------

    if (!empty($newActivities)) {

        foreach ($newActivities as $activityItem) {

            $allActivities[] = $activityItem;


            if (
                isset($activityItem["from"]["role"]) &&
                $activityItem["from"]["role"] === "bot"
            ) {

                $botResponseReceived = true;
            }
        }


        if (
            isset($activitiesResponse["watermark"])
        ) {

            $currentWatermark =
                $activitiesResponse["watermark"];
        }


        $lastNewActivityTime = time();
    }


    // --------------------------------------------------------
    // Bot responded + no new activity for settle period
    // --------------------------------------------------------

    if (
        $botResponseReceived &&
        $lastNewActivityTime !== null &&
        (time() - $lastNewActivityTime) >= $settleSeconds
    ) {

        break;
    }


    sleep($pollInterval);
}


// ============================================================
// 17. PROCESS BOT RESPONSE
// ============================================================

$messages = [];

$actions = [];


foreach ($allActivities as $activityItem) {


    // --------------------------------------------------------
    // Ignore anything not sent by bot
    // --------------------------------------------------------

    if (
        !isset($activityItem["from"]["role"]) ||
        $activityItem["from"]["role"] !== "bot"
    ) {

        continue;
    }


    $activityHtml = "";


    // --------------------------------------------------------
    // Normal bot text
    // --------------------------------------------------------

    if (
        isset($activityItem["text"]) &&
        trim($activityItem["text"]) !== ""
    ) {

        $text = trim($activityItem["text"]);


        if (containsHtml($text)) {

            $activityHtml .= $text;
        } else {

            $activityHtml .=
                "<p>" .
                formatPlainText($text) .
                "</p>";
        }
    }


    // --------------------------------------------------------
    // Attachments
    // --------------------------------------------------------

    if (
        isset($activityItem["attachments"]) &&
        is_array($activityItem["attachments"])
    ) {

        foreach ($activityItem["attachments"] as $attachment) {


            $contentType =
                $attachment["contentType"] ?? "";


            // ------------------------------------------------
            // Adaptive Card
            // ------------------------------------------------

            if (
                $contentType ===
                "application/vnd.microsoft.card.adaptive"
            ) {

                $card =
                    $attachment["content"] ?? [];


                $cardHtml =
                    parseAdaptiveCard(
                        $card,
                        $actions
                    );


                if ($cardHtml !== "") {

                    $activityHtml .=
                        '<div class="adaptive-card">' .
                        $cardHtml .
                        '</div>';
                }
            }


            // ------------------------------------------------
            // HTML attachment
            // ------------------------------------------------

            elseif (
                $contentType === "text/html"
            ) {

                $content =
                    $attachment["content"] ?? "";


                if (is_string($content)) {

                    $activityHtml .= $content;
                }
            }


            // ------------------------------------------------
            // Plain text attachment
            // ------------------------------------------------

            elseif (
                $contentType === "text/plain"
            ) {

                $content =
                    $attachment["content"] ?? "";


                if (is_string($content)) {

                    $activityHtml .=
                        "<p>" .
                        formatPlainText($content) .
                        "</p>";
                }
            }


            // ------------------------------------------------
            // Image attachment
            // ------------------------------------------------

            elseif (
                strpos(
                    $contentType,
                    "image/"
                ) === 0
            ) {

                $contentUrl =
                    $attachment["contentUrl"] ?? "";


                if ($contentUrl !== "") {

                    $safeUrl = htmlspecialchars(
                        $contentUrl,
                        ENT_QUOTES | ENT_SUBSTITUTE,
                        'UTF-8'
                    );


                    $activityHtml .=
                        '<img src="' .
                        $safeUrl .
                        '" style="max-width:100%;height:auto;" />';
                }
            }
        }
    }


    // --------------------------------------------------------
    // Suggested actions
    // --------------------------------------------------------

    if (
        isset($activityItem["suggestedActions"])
    ) {

        parseSuggestedActions(
            $activityItem["suggestedActions"],
            $actions
        );
    }


    // --------------------------------------------------------
    // Only add actual visible content
    // --------------------------------------------------------

    if (trim($activityHtml) !== "") {

        $messages[] = [
            "type" => "html",
            "content" => $activityHtml,
            "activityId" =>
            $activityItem["id"] ?? null
        ];
    }
}


// ============================================================
// 18. REMOVE DUPLICATE ACTION BUTTONS
// ============================================================

$actions = removeDuplicateActions($actions);


// ============================================================
// 19. RETURN CLEAN RESPONSE
// ============================================================

echo json_encode([

    "conversationId" => $conversationId,

    "watermark" => $currentWatermark,

    "messages" => $messages,

    "actions" => $actions,


    // --------------------------------------------------------
    // TEMPORARY DEBUG DATA
    //
    // Keep this while testing.
    // Remove rawResponse later when everything works.
    // --------------------------------------------------------

    "rawResponse" => [
        "activities" => $allActivities,
        "watermark" => $currentWatermark
    ]

], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
