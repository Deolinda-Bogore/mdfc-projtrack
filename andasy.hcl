app_name = "mdfc-projtrack"
type = "dockerfile"
port = 8080

env = {
  NODE_ENV = "production"
  PORT = "8080"
  DATA_DIR = "/app/data"
  MDFC_DB_PATH = "/app/data/database.json"
}

compute = {
  cpu = 1
  memory = 1024
}

storage = {
  name = "mdfc-projtrack-data"
  destination = "/app/data"
}
