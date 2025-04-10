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

# Configure Spark with the necessary Azure dependencies
jars_path = "/opt/anaconda3/envs/trading/jars"
azure_jars = f"{jars_path}/hadoop-azure-3.3.1.jar,{jars_path}/hadoop-azure-datalake-3.3.1.jar"

builder = SparkSession.builder.appName("MyApp") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .config("spark.jars", azure_jars)

spark = configure_spark_with_delta_pip(builder).getOrCreate()

# Configure Azure storage credentials
spark.conf.set("fs.azure.account.key.pprtradingstorage.dfs.core.windows.net", storage_key.value)
spark.conf.set("fs.azure.account.auth.type.pprtradingstorage.dfs.core.windows.net", "SharedKey")

# For ABFS (Azure Data Lake Storage Gen2)
spark.conf.set("fs.azure.account.auth.type", "SharedKey")
spark.conf.set("fs.azure.account.key.pprtradingstorage.dfs.core.windows.net", storage_key.value)
spark.conf.set("fs.abfss.impl", "org.apache.hadoop.fs.azurebfs.SecureAzureBlobFileSystem")
spark.conf.set("fs.AbstractFileSystem.abfss.impl", "org.apache.hadoop.fs.azurebfs.Abfss")

# Read from Delta table
df = spark.read.format("delta").load("abfss://data@pprtradingstorage.dfs.core.windows.net/clean/stocks_data/")
df.show()
