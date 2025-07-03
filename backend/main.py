from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pydantic import BaseModel
from tasks import run_attack_task

# 创建FastAPI应用实例
app = FastAPI(title="SkyGuard UAV Defense")

# 配置CORS（跨域资源共享）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境中应该指定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件服务
app.mount("/api/images", StaticFiles(directory="/app/results"), name="images")

# API模型
class DrillResponse(BaseModel):
    task_id: str
    message: str

class ResultResponse(BaseModel):
    status: str
    before_image_url: str = None
    after_image_url: str = None

@app.get("/")
def read_root():
    """API根路径，返回欢迎信息"""
    return {"message": "Welcome to SkyGuard UAV Defense API"}

@app.post("/api/start-basic-drill", response_model=DrillResponse)
async def start_basic_drill():
    """启动基础攻防演练"""
    # 生成任务ID
    task_id = str(uuid.uuid4())
    
    # 将任务推送到队列
    run_attack_task.delay(task_id)
    
    return {"task_id": task_id, "message": "Basic drill started"}

@app.get("/api/get-result/{task_id}", response_model=ResultResponse)
async def get_result(task_id: str):
    """获取演练结果"""
    result_path = f"/app/results/{task_id}"
    
    # 检查结果是否已经生成
    if not os.path.exists(result_path):
        return {"status": "PENDING"}
    
    # 检查必要的结果文件是否存在
    before_path = os.path.join(result_path, "result_before", "test_image.jpg")
    after_path = os.path.join(result_path, "result_after", "test_image.jpg")
    
    if os.path.exists(before_path) and os.path.exists(after_path):
        return {
            "status": "COMPLETED",
            "before_image_url": f"/api/images/{task_id}/result_before/test_image.jpg",
            "after_image_url": f"/api/images/{task_id}/result_after/test_image.jpg"
        }
    
    # 如果文件夹存在但文件尚未生成，任务仍在处理中
    return {"status": "PROCESSING"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
