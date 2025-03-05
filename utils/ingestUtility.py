import time
from pyspark.sql import SparkSession
import datetime
from pyspark.sql import SQLContext
import pyspark.sql.functions as F
import requests
import json

spark = SparkSession.builder.getOrCreate()
try:
    import IPython
    dbutils = IPython.get_ipython().user_ns["dbutils"]
except (ImportError, KeyError):
    dbutils = None
    
def csvReadNoSchema(inputpath, options__multiline=False):
    df = spark.read.format('csv').options(header='true', inferSchema=False, mode="DROPMALFORMED", comment='#',
                                          sep=',', multiline=options__multiline).load(inputpath)
    return df

def renameOutputFile(OutputPath):
    time.sleep(10)
    files = dbutils.fs.ls(OutputPath)
    csv_file = [x.path for x in files if x.path.endswith(".csv")][0]
    dbutils.fs.mv(csv_file, OutputPath.rstrip('/') + ".csv")
    dbutils.fs.rm(OutputPath, recurse=True)

def writeToDataLake(df, OutputPathFile, Mode):
    df.coalesce(1).write.format('com.databricks.spark.csv').mode(Mode).option("header", "true").option("delimiter",
                                                                                                       ",").save(
        OutputPathFile)