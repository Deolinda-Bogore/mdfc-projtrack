app_name = "mdfc-projtrack"

app {
  primary_region = "fsn"
  port = 8080

  env = {
    NODE_ENV = "production"
    PORT = "8080"
    DATA_DIR = "/app/data"
    MDFC_DB_PATH = "/app/data/database.json"
  }

  compute {
    cpu = 1
    memory = 1024
    cpu_kind = "shared"
  }

  process {
    name = "web"
  }
}
