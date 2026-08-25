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
    date: '',
    description: 'B站<琛光无人机>开源。琛光 E1_MINI 是迷你四轴无人机，主控使用 ESP32 开发板，仅使用一块陀螺仪传感器，自带网页遥控器。极简的硬件和软件设计更容易上手，手机连接即可起飞。',
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
        url: '/assets/projects/_files/mcu/琛光无人机/琛光E1_Mini V1.1Y无人机.zip',
        sizeLabel: '26.9MB'
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
    description: '工程训练作业，开源工程的全流程文件。基于ESP32的四路红外循迹小车。能实现遥控、循迹、避障功能。',
    tags: ['ESP32', 'PWM', '激光切割', 'SW完整建模'],
    link: 'https://github.com/deymocn/Arduino-line-follower',
    linkLabel: 'Github',
    link2: '',
    link2Label: '',
    cover: '/img/projects/line-car.webp',
    coverW: 1600,
    coverH: 1200,
    downloads: [
      {
        name: '循迹小车.zip',
        url: '/assets/projects/_files/mcu/智能循迹小车/循迹小车.zip',
        sizeLabel: '66.9MB'
      }
    ]
  },
  {
    id: 'led-matrix',
    title: 'ESP32 LED 点阵屏',
    category: '单片机',
    categoryKey: 'mcu',
    subtitle: '嵌入式 / 显示驱动',
    date: '2025',
    description: '原作者：B站浪迹天涯的鸟。使用 ESP32 + 16×16 WS2812 灯板，借鉴 Flip 思路实现流动的水与跳动的火焰等实时算法特效，多帧率可调、可扩展。',
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
        url: '/assets/projects/_files/mcu/LED 点阵屏/esp32-led-matrix-main.zip',
        sizeLabel: '3.7MB'
      }
    ]
  },
  {
    id: 'kurtips',
    title: 'Kurtips建模入门',
    category: '建模',
    categoryKey: 'model',
    subtitle: '',
    date: '',
    description: '跟随Kurtips老师的入门之作。',
    tags: ['Blender5.2', '建模材质', '渲染合成', '动画'],
    link: '',
    linkLabel: '',
    link2: '',
    link2Label: '',
    cover: '/img/projects/kurtips-fox.webp',
    coverW: 1600,
    coverH: 1000,
    downloads: [
      {
        name: '小狐狸.blend',
        url: '/assets/projects/_files/model/Kurtips建模入门/小狐狸.blend',
        sizeLabel: '26.7MB'
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
    description: '机械原理结课作业，牛头刨床整机设计。',
    tags: ['机械设计', 'SolidWorks', '有限元分析', '动画演示'],
    link: '',
    linkLabel: '',
    link2: '',
    link2Label: '',
    cover: '/img/projects/shaper.webp',
    coverW: 1193,
    coverH: 936,
    downloads: [
      { name: '摆杆.SLDPRT', url: '/assets/projects/_files/model/牛头刨床设计/牛头刨床设计/建模/摆杆.SLDPRT', sizeLabel: '89KB' },
      { name: '曲柄.SLDPRT', url: '/assets/projects/_files/model/牛头刨床设计/牛头刨床设计/建模/曲柄.SLDPRT', sizeLabel: '111KB' },
      { name: '机架.SLDPRT', url: '/assets/projects/_files/model/牛头刨床设计/牛头刨床设计/建模/机架.SLDPRT', sizeLabel: '110KB' },
      { name: '滑块.SLDPRT', url: '/assets/projects/_files/model/牛头刨床设计/牛头刨床设计/建模/滑块.SLDPRT', sizeLabel: '61KB' },
      { name: '滑枕及销.SLDPRT', url: '/assets/projects/_files/model/牛头刨床设计/牛头刨床设计/建模/滑枕及销.SLDPRT', sizeLabel: '67KB' },
      { name: '牛头刨床.SLDASM', url: '/assets/projects/_files/model/牛头刨床设计/牛头刨床设计/建模/牛头刨床.SLDASM', sizeLabel: '155KB' },
      { name: '位移分析.mp4', url: '/assets/projects/_files/model/牛头刨床设计/牛头刨床设计/有限元分析/位移分析.mp4', sizeLabel: '2.5MB' },
      { name: '应力分析.mp4', url: '/assets/projects/_files/model/牛头刨床设计/牛头刨床设计/有限元分析/应力分析.mp4', sizeLabel: '1.6MB' },
      { name: '应变分析.mp4', url: '/assets/projects/_files/model/牛头刨床设计/牛头刨床设计/有限元分析/应变分析.mp4', sizeLabel: '2.6MB' },
      { name: '演示动画.mp4', url: '/assets/projects/_files/model/牛头刨床设计/牛头刨床设计/演示动画.mp4', sizeLabel: '1.3MB' },
      { name: '设计报告.doc', url: '/assets/projects/_files/model/牛头刨床设计/牛头刨床设计/设计报告.doc', sizeLabel: '1.8MB' }
    ]
  }
]
