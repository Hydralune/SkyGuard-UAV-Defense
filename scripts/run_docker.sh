#!/bin/bash

# 确保在项目根目录执行
cd "$(dirname "$0")/.."

# 启动所有服务
docker-compose up --build
