#cd backend && python main.py
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from celery.result import AsyncResult
import uuid, shutil, os, pathlib
import sys

# 添加当前目录到模块搜索路径，确保能找到模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import api # 引入 api 模块
from config.config_api import router as config_router # 引入 config_api 模块
from airsim_task.airsim_api import router as airsim_router # 引入 airsim_api 模块

app = FastAPI(title="SkyGuard API", version="1.0.0")

# CORS 设置，前端 dev 端口 5173 / 8080
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:8080",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RESULT_DIR = pathlib.Path("results")  
ASSET_DIR = pathlib.Path("assets")    
RESULT_DIR.mkdir(parents=True, exist_ok=True)
ASSET_DIR.mkdir(parents=True, exist_ok=True)

app.include_router(api.router)
app.include_router(config_router)
app.include_router(airsim_router)
# 如果直接运行此文件
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)