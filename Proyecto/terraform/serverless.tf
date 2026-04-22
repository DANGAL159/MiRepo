# terraform/serverless.tf

# 1. Comprimir tu código local de Node.js
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "../serverless/image-upload/index.js"
  output_path = "lambda_function.zip"
}

# 2. Crear el Rol IAM (Permisos para que la Lambda pueda guardar en S3)
resource "aws_iam_role" "lambda_role" {
  name = "lambda_s3_role_g9"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# Adjuntar política de S3 al rol
resource "aws_iam_role_policy_attachment" "lambda_s3_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# Adjuntar política básica de ejecución (para que Lambda pueda escribir logs en CloudWatch)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 3. Crear la Función Lambda
resource "aws_lambda_function" "image_upload_lambda" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "image_upload_handler_g9"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs18.x" # Node 18 ya incluye el AWS SDK v3 nativamente

  # Inyectamos el nombre del bucket como variable de entorno
  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.imagenes.id
    }
  }
}

# 4. Crear el API Gateway (Requisito de la rúbrica)
resource "aws_apigatewayv2_api" "lambda_api" {
  name          = "serverless_api_g9"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

# Conectar el API Gateway con la Lambda
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id             = aws_apigatewayv2_api.lambda_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.image_upload_lambda.invoke_arn
  integration_method = "POST"
}

# Crear la ruta (Endpoint)
resource "aws_apigatewayv2_route" "lambda_route" {
  api_id    = aws_apigatewayv2_api.lambda_api.id
  route_key = "POST /upload"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# Desplegar el API Gateway
resource "aws_apigatewayv2_stage" "lambda_stage" {
  api_id      = aws_apigatewayv2_api.lambda_api.id
  name        = "$default"
  auto_deploy = true
}

# Dar permiso al API Gateway para ejecutar la Lambda
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_upload_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lambda_api.execution_arn}/*/*"
}

# Imprimir la URL final en tu terminal
output "api_gateway_url" {
  value = "${aws_apigatewayv2_api.lambda_api.api_endpoint}/upload"
}