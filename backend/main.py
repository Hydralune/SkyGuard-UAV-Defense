from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from celery.result import AsyncResult
import uuid, shutil, os, pathlib

from backend.celery_app import celery_app  # type: ignore

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

RESULT_DIR = pathlib.Path("backend/results")
ASSET_DIR = pathlib.Path("backend/assets")
RESULT_DIR.mkdir(parents=True, exist_ok=True)
ASSET_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/ping")
async def ping():
    return {"msg": "pong"}


@app.post("/api/v1/attack/pgd")
async def launch_pgd(
    eps: float = 0.031,
    alpha: float = 0.01,
    steps: int = 10,
    image: UploadFile = File(None),
):
    """启动 PGD 攻击任务，返回 task_id 与 celery_id"""
    task_id = uuid.uuid4().hex

    # 保存上传图片（如果有）
    if image:
        img_path = ASSET_DIR / f"{task_id}_{image.filename}"
        try:
            with img_path.open("wb") as f:
                shutil.copyfileobj(image.file, f)
        finally:
            image.file.close()
        img_param = str(img_path)
    else:
        img_param = None

    # 调用 Celery 任务
    celery_id = celery_app.send_task(
        "attack.pgd", args=[task_id, eps, alpha, steps]
    )

    return {"task_id": task_id, "celery_id": celery_id.id}


@app.get("/api/v1/task/{celery_id}")
def task_status(celery_id: str):
    res = AsyncResult(celery_id, app=celery_app)
    return {"state": res.state, "result": res.result}


@app.get("/api/v1/attack/result/{task_id}/{filename}")
def download_result(task_id: str, filename: str):
    file_path = RESULT_DIR / task_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(file_path) 