# Airsim部署及使用教程

本文档将详细说明如何在本地部署airsim并运行，过程中遇到任何问题可以直接私信Hydralune。
首先打开airsim的官方仓库，https://github.com/microsoft/AirSim

![image-20250715150136431](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715150136431.png)

点击右边的release

![image-20250715150212152](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715150212152.png)

这里有很多的已经编译好的包，我们可以下载上面这些有具体名称的zip文件比如AbandonedPark.zip
Africa.zip，AirSimNH.zip，Blocks.zip，这里的CityEnviron.zip两个要一起下载并解压，我们以这个为例子，下载好后解压到特定文件夹。

![image-20250715150247988](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715150247988.png)

解压到文件夹内，点击WindowsNoEditor->CityEnviron.exe,就可以运行了

![image-20250715150624248](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715150624248.png)

首次运行会弹出这个选项，我们点击否，使用无人机。

![image-20250715150833384](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715150833384.png)

可看到，左上角有一些提示信息，按F1调出操作指南

![image-20250715150906872](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715150906872.png)

这里点击键盘的1，2，3可分别显示深度图，分割图，场景图，点击F切换到无人机视角，点击M可以自由移动摄像机视角（配合上下左右箭头和wasd还有pageup，pagedown），然后点击/可以快速回到将摄像头对准无人机。

![image-20250715151002937](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715151002937.png)

无人机无法直接移动，需要脚本控制或者使用游戏手柄或者无人机专用手柄，对初始的更多设置可以更改setting.json文件来更改。

我们点击alt+f4退出，然后找到本地文档。

![image-20250715151558404](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715151558404.png)

一般本地文档位置在C盘 ->用户->你自己的用户名->文档 下面，注意必须是英文，如果你的名称为“文档”，请像我一样改成docs或者documents，直接重命名就行了，不然客户端无法识别。

我们点击airsim文件夹，里面有settings.json，打开它

![image-20250715151923519](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715151923519.png)

我们以小车为例子，将里面内容替换为以下内容

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

然后保存，重新去打开我们的exe文件。

注意这里可能每次打开是全屏状态，如果不想全屏，可以这样打开，或者直接像我们后面那样给settings.json加个参数：

![image-20250715152411960](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715152411960.png)

进入后你会发现，已经变成了小车

![image-20250715152457578](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715152457578.png)

点击上下左右箭头可以移动，这里的控制手感和GTA差不多。

settings.json文件非常重要，是exe文件的初始化配置，很多内容可以在这里更改，比如多无人机。

现在我们改回去

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

保存即可，下次会以窗口化形式直接启动无人机模式。

接下来我将演示如何用脚本操控无人机。

打开我们项目的airsim文件夹，点开PythonClient，在终端创建名为airsim的conda环境，

```
conda create -n airsim python-3.9
```

```
conda activate airsim
```

使用PythonClient里面的requirements.txt安装相关包，记得先cd进这个目录

```
pip install -r requirements.txt
```

然后进入multirotor文件夹，里面有很多演示实例

我们点击hello_drone.py，在airsim环境下运行这个脚本

![image-20250715154258041](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715154258041.png)

根据脚本的指引，在终端press any key,可以看到无人机成功起飞，可以继续后续操作直至飞到一定高度，然后拍摄图片并复原。

![image-20250715154538053](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715154538053.png)

![image-20250715154603617](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715154603617.png)

我们再来尝试天气切换的脚本，点击PythonClient文件夹下的environment文件夹，点击weather.py并运行，可以切换天气![image-20250715154738045](https://cdn.jsdelivr.net/gh/Hydralune/Hydralunepicgo@main/image-20250715154738045.png)

至此对airsim的基本操作演示均已完成。后续请参考进阶操作，使用大模型控制我们的无人机。

请先克隆仓库airsim_agent-main，地址为https://github.com/maris205/airsim_agent，克隆后解压在我们项目的airsim_agent-main这里，覆盖原本的内容（建议文件夹也覆盖并删除，不要嵌套），然后根据其中的课程指引，继续操作,这里它使用的是jupyter环境，也是一样创建conda环境。如果你用vscode或者cursor的话可能图片加载会出问题，用jupyterlab就行了，逐条执行以下操作。

```
conda create -n airsim_agent python=3.10
conda activate airsim_agent
conda install jupyter ipykernel
python -m ipykernel install --user --name airsim_agent --display-name "Python (airsim_agent)"
jupyter lab
```

注意一定要激活airsim_agent环境，后面按照课程的演示来就行了。
