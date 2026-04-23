# terraform/cognito.tf
resource "aws_cognito_user_pool" "pool" {
  name                     = "semisocial_users_g9"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  password_policy {
    minimum_length    = 8
    require_lowercase = false
    require_numbers   = false
    require_symbols   = false
    require_uppercase = false
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name                = "semisocial_client_g9"
  user_pool_id        = aws_cognito_user_pool.pool.id
  generate_secret     = false
  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH", "ALLOW_ADMIN_USER_PASSWORD_AUTH"]
}

output "cognito_pool_id" { value = aws_cognito_user_pool.pool.id }
output "cognito_client_id" { value = aws_cognito_user_pool_client.client.id }