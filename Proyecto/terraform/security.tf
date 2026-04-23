# terraform/security.tf

# 1. Seguridad para el Balanceador de Carga (ALB)
# Permite que cualquier persona en internet vea tu página web
resource "aws_security_group" "alb_sg" {
  name        = "alb-security-group"
  description = "Permitir trafico HTTP publico"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 2. Seguridad para las EC2 (Tu Backend Node.js y Python)
# Solo permite tráfico que venga del Balanceador de Carga
resource "aws_security_group" "ec2_sg" {
  name        = "ec2-security-group"
  description = "Permitir trafico desde el ALB"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # Puerto 22 para que puedas entrar por SSH a configurarlas
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 3. Seguridad para la Base de Datos RDS
# Solo permite tráfico en el puerto 5432 que venga de tus EC2
resource "aws_security_group" "rds_sg" {
  name        = "rds-security-group"
  description = "Permitir trafico desde las instancias EC2"
  vpc_id      = aws_vpc.main_vpc.id



  # NUEVA REGLA: Permite que CUALQUIER IP de internet se conecte (DBeaver)
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}