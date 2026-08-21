<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle browser/app preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Read JSON request
$input = json_decode(file_get_contents("php://input"), true);

// Support both POST JSON and GET ?message=hi
$message = "";

if (isset($input['message'])) {
    $message = trim(strtolower($input['message']));
} elseif (isset($_GET['message'])) {
    $message = trim(strtolower($_GET['message']));
}

// If message is missing
if ($message === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Message is required"
    ], JSON_PRETTY_PRINT);

    exit;
}


// ----------------------------------------------------
// RESPONSE FOR "HI"
// ----------------------------------------------------

if (
    $message === "hi" ||
    $message === "hello" ||
    $message === "hey"
) {

    $response = [

        "success" => true,

        "type" => "rich_message",

        "message_id" => uniqid("msg_"),

        "reply" => "Hi! 👋 Welcome. Here is your information.",

        "content" => [

            // Heading
            [
                "type" => "heading",
                "level" => 1,
                "text" => "Welcome to the Learning Assistant"
            ],

            // Paragraph
            [
                "type" => "text",
                "text" => "I can help you view your learning information, courses, scores, topics and useful resources."
            ],

            // Topic / Section
            [
                "type" => "section",
                "title" => "Available Topics",
                "subtitle" => "Choose any topic below",
                "items" => [
                    [
                        "title" => "My Score Card",
                        "description" => "View assessment scores and progress.",
                        "icon" => "chart"
                    ],
                    [
                        "title" => "My Courses",
                        "description" => "View your active and completed courses.",
                        "icon" => "book"
                    ],
                    [
                        "title" => "Upcoming Classes",
                        "description" => "Check your upcoming learning sessions.",
                        "icon" => "calendar"
                    ]
                ]
            ],

            // Sub heading
            [
                "type" => "heading",
                "level" => 2,
                "text" => "Current Progress"
            ],

            // Table
            [
                "type" => "table",

                "title" => "Assessment Results",

                "columns" => [
                    [
                        "key" => "module",
                        "label" => "Module"
                    ],
                    [
                        "key" => "score",
                        "label" => "Score"
                    ],
                    [
                        "key" => "status",
                        "label" => "Status"
                    ]
                ],

                "rows" => [
                    [
                        "module" => "Web Development",
                        "score" => "85%",
                        "status" => "Passed"
                    ],
                    [
                        "module" => "Database Systems",
                        "score" => "78%",
                        "status" => "Passed"
                    ],
                    [
                        "module" => "Mobile Development",
                        "score" => "92%",
                        "status" => "Excellent"
                    ]
                ]
            ],

            // Another text block
            [
                "type" => "text",
                "title" => "Recommendation",
                "text" => "Your overall performance is good. Consider reviewing Database Systems before your next assessment."
            ],

            // Bullet list
            [
                "type" => "list",
                "title" => "Things You Can Ask",
                "style" => "bullet",

                "items" => [
                    "Show my score card",
                    "Show my courses",
                    "What classes do I have today?",
                    "Show my attendance",
                    "Show my assignments"
                ]
            ],

            // Links
            [
                "type" => "links",
                "title" => "Useful Links",

                "items" => [
                    [
                        "label" => "Student Portal",
                        "url" => "https://example.com/student"
                    ],
                    [
                        "label" => "Learning Management System",
                        "url" => "https://example.com/lms"
                    ],
                    [
                        "label" => "Support",
                        "url" => "https://example.com/support"
                    ]
                ]
            ],

            // Buttons / Actions
            [
                "type" => "actions",

                "buttons" => [
                    [
                        "id" => "scorecard",
                        "label" => "View Score Card",
                        "action" => "send_message",
                        "value" => "Show my score card"
                    ],
                    [
                        "id" => "courses",
                        "label" => "View Courses",
                        "action" => "send_message",
                        "value" => "Show my courses"
                    ],
                    [
                        "id" => "portal",
                        "label" => "Open Portal",
                        "action" => "open_url",
                        "url" => "https://example.com/student"
                    ]
                ]
            ]

        ],

        "metadata" => [
            "source" => "PHP Demo API",
            "version" => "1.0",
            "timestamp" => date("c")
        ]
    ];


    echo json_encode(
        $response,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
    );

    exit;
}


// ----------------------------------------------------
// SCORE CARD RESPONSE
// ----------------------------------------------------

if (
    $message === "show my score card" ||
    $message === "score card" ||
    $message === "scorecard"
) {

    echo json_encode([

        "success" => true,

        "type" => "rich_message",

        "reply" => "Here is your score card.",

        "content" => [

            [
                "type" => "heading",
                "level" => 1,
                "text" => "My Score Card"
            ],

            [
                "type" => "table",

                "columns" => [
                    [
                        "key" => "subject",
                        "label" => "Subject"
                    ],
                    [
                        "key" => "score",
                        "label" => "Score"
                    ],
                    [
                        "key" => "grade",
                        "label" => "Grade"
                    ]
                ],

                "rows" => [
                    [
                        "subject" => "Programming",
                        "score" => 88,
                        "grade" => "A"
                    ],
                    [
                        "subject" => "Database",
                        "score" => 76,
                        "grade" => "B+"
                    ],
                    [
                        "subject" => "UI/UX",
                        "score" => 91,
                        "grade" => "A+"
                    ]
                ]
            ],

            [
                "type" => "summary",

                "data" => [
                    "average" => "85%",
                    "completed_modules" => 3,
                    "passed_modules" => 3,
                    "failed_modules" => 0
                ]
            ]

        ],

        "timestamp" => date("c")

    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

    exit;
}


// ----------------------------------------------------
// DEFAULT RESPONSE
// ----------------------------------------------------

echo json_encode([

    "success" => true,

    "type" => "text",

    "reply" => "Sorry, I don't understand that message yet.",

    "suggestions" => [
        "Hi",
        "Show my score card"
    ],

    "timestamp" => date("c")

], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
