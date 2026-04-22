# terraform/database.tf

# Agrupamos las subredes donde vivirá la base de datos
resource "aws_db_subnet_group" "db_subnet" {
  name       = "main-db-subnet"
  subnet_ids = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]

  tags = {
    Name = "Subredes de BD Semi-Social"
  }
}

# Creamos la instancia de PostgreSQL en Amazon RDS
resource "aws_db_instance" "postgres_db" {
  identifier        = "semisocial-db"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t3.micro" # Capa gratuita
  allocated_storage = 20            # 20 GB de disco

  db_name  = "semisocial"
  username = "dbadmin" # Mismas credenciales que tu .env local
  password = "adminpassword"

  db_subnet_group_name   = aws_db_subnet_group.db_subnet.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  publicly_accessible = true # Para que puedas conectarte desde tu máquina local con DBeaver/pgAdmin
  skip_final_snapshot = true # Evita que AWS cobre por backups al destruir la BD
}

# Esto imprimirá la URL de la base de datos en tu terminal cuando termine
output "rds_endpoint" {
  value = aws_db_instance.postgres_db.endpoint
}