<?php

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

define("DIRECTLINE_SECRET", $_ENV['DIRECTLINE_SECRET']);
define("DIRECTLINE_ENDPOINT", $_ENV['DIRECTLINE_ENDPOINT']);

header("Content-Type: application/json");
