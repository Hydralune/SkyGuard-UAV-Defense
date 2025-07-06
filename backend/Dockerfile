
FROM python:3.9-slim
#使用清华镜像
RUN set -eux; \
    codename="$(. /etc/os-release && echo $VERSION_CODENAME)"; \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian ${codename} main contrib non-free" > /etc/apt/sources.list; \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian ${codename}-updates main contrib non-free" >> /etc/apt/sources.list; \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian-security ${codename}-security main contrib non-free" >> /etc/apt/sources.list

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 复制并安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p /app/assets /app/results

# 设置默认命令
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
