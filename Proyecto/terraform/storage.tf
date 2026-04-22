# terraform/storage.tf

# 1. Crear el Bucket S3 para las imágenes
resource "aws_s3_bucket" "imagenes" {
  bucket        = "semi1proyecto-g9-202203361"
  force_destroy = true # Permite borrar el bucket aunque tenga fotos dentro
}

# 2. Desactivar el bloqueo de acceso público
resource "aws_s3_bucket_public_access_block" "imagenes_public_access" {
  bucket                  = aws_s3_bucket.imagenes.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# 3. Política para que cualquiera en internet pueda LEER las imágenes
resource "aws_s3_bucket_policy" "imagenes_policy" {
  bucket = aws_s3_bucket.imagenes.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.imagenes.arn}/*"
      }
    ]
  })

  # Terraform debe esperar a que el bloque público se desactive antes de aplicar esta política
  depends_on = [aws_s3_bucket_public_access_block.imagenes_public_access]
}