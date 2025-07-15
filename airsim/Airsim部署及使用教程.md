# Airsim部署及使用教程

本文档将详细说明如何在本地部署airsim并运行。
首先打开airsim的官方仓库，https://github.com/microsoft/AirSim

![image-20250715150136431](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715150136431.png)

点击右边的release

![image-20250715150212152](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715150212152.png)

这里有很多的已经编译好的压缩包，我们可以下载上面这些有具体名称的zip文件比如AbandonedPark.zip
Africa.zip，AirSimNH.zip，Blocks.zip，这里的CityEnviron.zip 是大型环境，因此被划分为多个文件，下载 001、002 文件后，使用 [7zip](http://www.7-zip.org/download.html) 等软件右键单击 001 文件并选择其中一个提取选项。7zip 将自动检测并使用所有文件。我们以CityEnviron为例子，下载好后解压到文件夹（自己选一个位置，可以和我们的仓库SkyGuard-UAV-Defense所在文件夹放在同一个目录下，但注意每次提交不要将这个也提交，可手动添加至.gitignore）。

![image-20250715150247988](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715150247988.png)

解压到文件夹内，进入WindowsNoEditor，点击CityEnviron.exe,就可以运行了

![image-20250715150624248](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715150624248.png)

首次运行会弹出这个选项，我们点击否（意思是用四旋翼无人机仿真），使用无人机。

![image-20250715150833384](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715150833384.png)

可看到，左上角有一些提示信息，按F1调出操作指南

![image-20250715150906872](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715150906872.png)

这里点击键盘的1，2，3可分别显示深度图，分割图，场景图，按F键切换到无人机视角，按M键可以自由移动摄像机视角（配合上下左右箭头和wasd还有pageup，pagedown），然后按“/”可以快速回到将摄像头对准无人机。

![image-20250715151002937](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715151002937.png)

无人机无法直接移动，需要脚本控制或者使用游戏手柄或者无人机专用手柄，对初始的更多设置可以更改**setting.json文件**来更改。

按alt+f4退出仿真程序，按照上述地址找到settings.json。

![image-20250715151558404](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715151558404.png)

（一般本地文档位置在C盘 ->用户->你自己的用户名->文档 下面，即C:\Users\\<你的用户名>\Documents\AirSim\settings.json，注意全部路径必须是英文。如果你的文件夹名称为“文档”，请改成Documents，直接重命名就行了，不然客户端无法识别。可以通过复制地址来看自己的文档文件夹是否叫Documents。

![image-20250715235531786](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715235531786.png)

点击airsim文件夹，里面有settings.json，打开它![image-20250715151923519](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715151923519.png)

以小车为例子，将settings.json里面的内容替换为以下

```
{
  "SettingsVersion": 1.2,
  "SimMode": "Car",
  "Vehicles": {
    "PhysXCar": {
      "VehicleType": "PhysXCar",
      "AutoCreate": true,
      "RC": {
        "RemoteControlID": -1
      }
    }
  }
}
```

然后保存

重新去双击打开我们的CityEnviron.exe文件。

注意这里可能每次打开是全屏状态，如果不想全屏，有下列三种方法：

1、改为终端输入命令（加上 -windowed）进入

```
CityEnviron.exe -windowed
```

2、修改settings.json加个参数 "Fullscreen": false（后面有说明）（如果此方法无效，可用方法3、alt+enter）

3、按alt+enter进入小窗模式（推荐）

![image-20250715152411960](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715152411960.png)

进入后你会发现，已经变成了小车

![image-20250715152457578](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715152457578.png)

点击上下左右箭头可以移动，这里的控制手感和GTA差不多。

settings.json文件非常重要，是exe文件的初始化配置，很多内容可以在这里更改，比如多无人机。

现在我们修改settings.json文件，改回无人机

```

{
  "SettingsVersion": 1.2,
  "SimMode": "Multirotor",
  "Window": {
    "Fullscreen": false,
    "Width": 1280,
    "Height": 720
  },
  "Vehicles": {
    "UAV1": {
      "VehicleType": "SimpleFlight",
      "X": 0,
      "Y": 0,
      "Z": -2,
      "Yaw": 0
    }
  }
}
```

保存，下次会以窗口化形式直接启动无人机模式。



接下来将演示如何用脚本控制无人机。

打开我们的项目SkyGuard-UAV-Defense的airsim文件夹，点开进入PythonClient，打开终端创建名为airsim的conda环境，并激活

```
conda create -n airsim python=3.9
```

```
conda activate airsim
```

先cd进入PythonClient，使用PythonClient里面的requirements.txt安装相关包

```
pip install -r requirements.txt
```

然后cd进入multirotor文件夹，里面有很多演示实例

我们选择其中的hello_drone.py来演示，在hello_drone.py所在目录下打开终端，**在airsim环境下**运行这个脚本

```
python hello_drone.py
```

**（注意，在运行脚本前，要先打开CityEnviron.exe进入仿真程序，再运行脚本）**

![image-20250715154258041](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715154258041.png)

根据终端脚本的指引，在终端接连按照指示press any key,可以依次看到无人机成功起飞，飞到一定高度，然后拍摄图片，最后复原。

![image-20250715154538053](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715154538053.png)

![image-20250715154603617](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715154603617.png)



我们再来尝试天气切换的脚本，点击PythonClient文件夹下的environment文件夹，终端**在airsim环境**下运行weather.py，在终端中按照提示press any key依次切换天气（同样要先让仿真程序运行）

```
python weather.py
```

![image-20250715154738045](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715154738045.png)

至此对airsim的基本操作演示均已完成。

后续参考进阶操作，使用大模型控制我们的无人机。

**airsim-agent课程：**

github仓库为[airsim_agent](https://github.com/maris205/airsim_agent)，在我们项目SkyGuard-UAV-Defense的airsim文件夹里克隆，克隆后进入airsim文件夹，根据其中的课程指引，继续操作,这里它使用的是jupyter环境，也是一样创建conda环境。如果你用vscode或者cursor的话可能图片加载会出问题，用jupyterlab来看教程就可以了，具体步骤如下

（在SkyGuard-UAV-Defense\airsim\airsim_agent中打开终端操作）

```
conda create -n airsim_agent python=3.10
conda activate airsim_agent
conda install jupyter ipykernel
python -m ipykernel install --user --name airsim_agent --display-name "Python (airsim_agent)"
jupyter lab
```

即可进入jupyter lab查看课程

注意要先激活airsim_agent环境再打开课程

```
conda activate airsim_agent
jupyter lab
```

![image-20250715235856880](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715235856880.png)
