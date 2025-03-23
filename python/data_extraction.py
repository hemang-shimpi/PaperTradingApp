from pyspark.sql import *
from delta import *
from dotenv import load_dotenv
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.core.exceptions import ClientAuthenticationError
import os

load_dotenv(dotenv_path="secrets.env") 

client_id = os.getenv('AZURE_CLIENT_ID')
tenant_id = os.getenv('AZURE_TENANT_ID')
client_secret = os.getenv('AZURE_CLIENT_SECRET')

key_vault_url = "https://keyspprtrading.vault.azure.net/"
secret_name = "storage-key"

try:
    credential = DefaultAzureCredential()
    client = SecretClient(vault_url=key_vault_url, credential=credential)
    storage_key = client.get_secret(secret_name)
except ClientAuthenticationError as e:
    print("Auth failed:", e.message)
except Exception as e:
    print("Unexpected error:", e)

builder = SparkSession.builder.appName("MyApp") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")

spark = configure_spark_with_delta_pip(builder).getOrCreate()

spark.conf.set("fs.azure.account.key.pprtradingstorage.dfs.core.windows.net", storage_key.value)

df = spark.read.format("delta").load("abfss://data@pprtradingstorage.dfs.core.windows.net/clean/stocks_data/")
df.show()
