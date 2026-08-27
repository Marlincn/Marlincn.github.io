'use strict'
/* 工程页数据快照(2026-08-26):
   - 来源:deymo-site/portfolio 各 info.json(title/category/description/tags/link/link2)
     + deymo-site portfolio-manifest.json(downloads 文件清单与尺寸)
   - 描述文案保持 info.json 原文;下载文件托管在 deymocn.github.io(外链)。
   维护:新增工程时在此追加条目,封面图放 source/img/projects/ 并转 webp(质量 80)。 */

module.exports = [
  {
    id: 'drone',
    title: '琛光无人机',
    category: '单片机',
    categoryKey: 'mcu',
    subtitle: '',
    date: '2026',
    description: '琛光 E1_MINI 是迷你四轴无人机，主控使用 ESP32 开发板，仅使用一块陀螺仪传感器，自带网页遥控器，手机连接即可起飞。',
    intro: '复刻 B 站《琛光无人机》开源项目的迷你四轴无人机琛光 E1_MINI：主控用 ESP32 开发板，仅用一块陀螺仪传感器，自带网页遥控器，手机连接即可起飞。硬件与软件设计都压到极简——自有固件、物料清单（V1.1Y）与乐鑫烧录工具一并公开，从打板、焊接、烧录到起飞全流程可跟做。',
    tags: ['ESP32', '四轴', '网页遥控', '可自焊'],
    link: 'https://github.com/songge8/CF-Drone',
    linkLabel: 'Github',
    link2: 'https://oshwhub.com/songge8/project_qqqyfdkm',
    link2Label: '嘉立创',
    cover: '/img/projects/drone.webp',
    coverW: 535,
    coverH: 372,
    downloads: [
      {
        name: '琛光E1_Mini V1.1Y无人机.zip',
        url: '/assets/projects/琛光无人机/琛光E1_Mini V1.1Y无人机.zip',
        sizeLabel: '26.9MB',
        desc: '整机整包：固件、物料清单与烧录工具。',
        files: [
          { name: '琛光E1_MINI固件20260507.bin', sizeLabel: '4MB', desc: '飞控固件' },
          { name: 'CF-Drone-main.zip', sizeLabel: '88KB', desc: '开源完整源码' },
          { name: '琛光E1_Mini V1.1Y物料清单.xlsx', sizeLabel: '13KB', desc: '物料清单' },
          { name: '乐鑫烧录工具/', sizeLabel: '25MB', desc: 'flash_download_tool 3.9.11 烧录工具' }
        ]
      }
    ]
  },
  {
    id: 'line-car',
    title: '智能循迹小车',
    category: '单片机',
    categoryKey: 'mcu',
    subtitle: '',
    date: '2025',
    description: '工程训练结课作业的全流程开源项目：四路红外循迹小车。Arduino Uno 主控，红外循迹、蓝牙遥控、超声避障三种玩法一键切换；PWM 调速，全套文件公开。',
    intro: '工程训练结课作业的全流程开源项目：四路红外循迹小车。Arduino Uno 主控（配 R3 v5 拓展板与 L298N 驱动板），红外 TCRT5000、蓝牙 JDY-31、超声波 HC-SR04。三种玩法——蓝牙遥控（X 键切换自动循线/手动遥控）、四路红外自动循迹、超声波避障（16cm 触发）；PWM 连续调速、1–10 档速度与蓝牙心跳保活。全套说明文档、固件与 PWM 拓展代码、连线图与 Proteus 仿真、激光切割结构件与 SolidWorks 完整建模全部公开。',
    tags: ['ESP32', 'PWM', '激光切割', 'SW完整建模'],
    link: 'https://github.com/Marlincn/Arduino-line-follower',
    linkLabel: 'Github',
    link2: '',
    link2Label: '',
    cover: '/img/projects/line-car.webp',
    coverW: 1600,
    coverH: 1200,
    downloads: [
      {
        name: '循迹小车.zip',
        url: '/assets/projects/智能循迹小车/循迹小车.zip',
        sizeLabel: '66.9MB',
        desc: '整车整包：固件、连线图、激光切割结构件与 SolidWorks 建模。',
        files: [
          { name: 'README.md', sizeLabel: '15KB', desc: '全流程说明文档' },
          { name: 'code.ino + PWM拓展/main_PWM.cpp', sizeLabel: '14KB', desc: '完整固件与 PWM 拓展代码' },
          { name: '连线图.pdsprj + 连线图_PWM.pdsprj', sizeLabel: '48KB', desc: 'Proteus 连线图工程' },
          { name: '物料清单.xlsx', sizeLabel: '14KB', desc: '物料清单' },
          { name: '激光切割图纸/（底板等 4 张）', sizeLabel: '223KB', desc: '激光切割结构件' },
          { name: '建模.zip + 建模兼容.STEP', sizeLabel: '22MB', desc: 'SolidWorks 完整建模' },
          { name: 'images/ + PWM拓展/（图纸与示意）', sizeLabel: '47MB', desc: '接线与效果图' }
        ]
      }
    ]
  },
  {
    id: 'led-matrix',
    title: 'ESP32 LED 点阵屏',
    category: '单片机',
    categoryKey: 'mcu',
    subtitle: '单片机',
    date: '2025',
    description: '使用 ESP32 + 16×16 WS2812 灯板，借鉴 Flip 思路实现流动的水与跳动的火焰等实时算法特效，多帧率可调、可扩展。',
    intro: '复刻 B 站浪迹天涯的鸟的"算法驱动"LED 点阵屏：ESP32 驱动 16×16 WS2812 灯板，做成一套可扩展的实时效果框架——借用 Flip 思路实现会流动的水（含 MPU6050 重力感应水波），另有 DOOM 风格跳动火花；esp_dsps 加速可选、支持蛇形走位映射，IO0 按键随时切换效果与颜色。打板文件（嘉立创）、焊接与接线说明、购置清单全公开，从热台焊接、烧录固件到上电点亮可完整跟做。',
    tags: ['ESP32', 'WS2812', 'FLIP', '算法特效'],
    link: 'https://github.com/cccAboy/esp32-led-matrix',
    linkLabel: 'GitHub',
    link2: 'https://oshwhub.com/ccbaw123/deng-ban-flip',
    link2Label: '嘉立创',
    cover: '/img/projects/led-matrix.webp',
    coverW: 1280,
    coverH: 720,
    downloads: [
      {
        name: 'esp32-led-matrix-main.zip',
        url: '/assets/projects/LED 点阵屏/esp32-led-matrix-main.zip',
        sizeLabel: '3.7MB',
        desc: '源工程整包：固件源码与打板文件。',
        files: [
          { name: 'firmware/（完整固件源码）', sizeLabel: '2.6MB', desc: '水波/DOOM 火焰/传感器驱动 + 可选 esp_dsps 加速' },
          { name: 'hardware/（打板文件）', sizeLabel: '1MB', desc: '灯板 FLIP 嘉立创工程 .epro2 ×2' },
          { name: '水流灯板简易复刻固件/', sizeLabel: '650KB', desc: 'S 形/Z 形灯板预编译 bin + 接线图' },
          { name: 'docs/（文档与展示图）', sizeLabel: '2.1MB', desc: '购置清单、README、展示与接线图' }
        ]
      }
    ]
  },
  {
    id: 'kurtips',
    title: 'Blender 建模入门',
    category: '建模',
    categoryKey: 'model',
    subtitle: '',
    date: '2026',
    description: '跟随 Kurtips 老师完成的第一件 Blender 作品：小狐狸。从基础建模、材质、渲染到动画整条链路逐一走通，成品 .blend 源文件公开，方便对照学习。',
    intro: '跟随 Kurtips 老师完成的第一件 Blender 作品：小狐狸。从基础建模开始，依次走通建模材质、渲染合成与动画整条链路（Blender 5.2），把课堂里学到的流程完整练习了一遍。成品 .blend 源文件公开，方便对照学习。',
    tags: ['Blender5.2', '建模材质', '渲染合成', '动画'],
    link: 'https://kurtwei.com/blender-beginner-tutorial-free-course/',
    linkLabel: '课程地址',
    link2: '',
    link2Label: '',
    cover: '/img/projects/kurtips-fox.webp',
    coverW: 1600,
    coverH: 1000,
    downloads: [
      {
        name: '小狐狸.blend',
        url: '/assets/projects/Kurtips建模入门/小狐狸.blend',
        sizeLabel: '26.7MB',
        desc: 'Blender 5.2 成品源文件（.blend），含全部建模与材质操作。',
        files: [
          { name: '小狐狸.blend', sizeLabel: '26.7MB', desc: 'Blender 5.2 源文件：建模/材质/渲染/动画全过程' }
        ]
      }
    ]
  },
  {
    id: 'shaper',
    title: '牛头刨床设计',
    category: '建模',
    categoryKey: 'model',
    subtitle: '',
    date: '2025',
    description: '机械原理课程结课作业：牛头刨床整机设计。用 SolidWorks 完成曲柄、摆杆、机架、滑块等零件建模与整机装配，关键结构有限元分析，附演示动画与报告。',
    intro: '机械原理课程结课作业：牛头刨床整机设计。用 SolidWorks 完成曲柄、摆杆、机架、滑块、滑枕及销等零件的建模与整机装配，对关键结构做有限元分析并输出位移、应力、应变三组结果，另附机构演示动画与设计报告。整套三维源文件与报告全部公开。',
    tags: ['机械设计', 'SolidWorks', '有限元分析', '动画演示'],
    link: '',
    linkLabel: '',
    link2: '',
    link2Label: '',
    cover: '/img/projects/shaper.webp',
    coverW: 1193,
    coverH: 936,
    downloads: [
      {
        name: '牛头刨床设计-全套资料.zip',
        url: '/assets/projects/牛头刨床设计/牛头刨床设计-全套资料.zip',
        sizeLabel: '10.3MB',
        desc: '全套课程设计资料：源文件、有限元分析动画与设计报告。',
        files: [
          { name: '建模/曲柄.SLDPRT', sizeLabel: '111KB', desc: '曲柄零件' },
          { name: '建模/摆杆.SLDPRT', sizeLabel: '89KB', desc: '摆杆零件' },
          { name: '建模/机架.SLDPRT', sizeLabel: '110KB', desc: '机架零件' },
          { name: '建模/滑块.SLDPRT', sizeLabel: '61KB', desc: '滑块零件' },
          { name: '建模/滑枕及销.SLDPRT', sizeLabel: '67KB', desc: '滑枕及销零件' },
          { name: '建模/牛头刨床.SLDASM', sizeLabel: '155KB', desc: '整机装配体' },
          { name: '有限元分析/位移分析.mp4', sizeLabel: '2.5MB', desc: '位移分析结果动画' },
          { name: '有限元分析/应力分析.mp4', sizeLabel: '1.6MB', desc: '应力分析结果动画' },
          { name: '有限元分析/应变分析.mp4', sizeLabel: '2.6MB', desc: '应变分析结果动画' },
          { name: '演示动画.mp4', sizeLabel: '1.3MB', desc: '机构运动演示动画' },
          { name: '设计报告.doc', sizeLabel: '1.8MB', desc: '课程设计报告' }
        ]
      }
    ]
  }
]
