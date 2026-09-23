import type {ReferencePhoto} from './real-media'
const source=(name:string)=>'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(name.replaceAll(' ','_'))
const pd='https://creativecommons.org/publicdomain/mark/1.0/'
export const DEVICE_PHOTOS:Record<string,ReferencePhoto & {portrait?:boolean}>={
 D1:{image:'./media/devices/soil-logger.jpg',title:'田间土壤水分采集器',caption:'田间水分数据记录器实拍参考；并非本平台设备的现场照片。',author:'USDA NRCS Montana',source:source('Irrigation65 (37973074585).jpg'),license:'Public domain',licenseUrl:pd},
 D2:{image:'./media/devices/soil-meter.jpg',title:'手持土壤水分测量仪',caption:'人工复测土壤水分的设备实拍参考，不代表平台设备型号或实时采集画面。',author:'USDA NRCS Montana',source:source('Irrigation89 (23995172897).jpg'),license:'Public domain',licenseUrl:pd},
 D3:{image:'./media/devices/soil-probe.jpg',title:'插入式土壤水分探头',caption:'园艺用土壤水分测量探头实拍参考，不代表平台设备型号。',author:'Sealman',source:source('Soil moisture sensor.JPG'),license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',portrait:true},
 D4:{image:'./media/devices/weather-station.jpg',title:'气象站传感器维护',caption:'气象站风速、温湿度等传感器的维护实拍参考。',author:'Scott Bauer / USDA ARS',source:source('Weather Station USDA.jpg'),license:'Public domain',licenseUrl:pd},
 D5:{image:'./media/devices/irrigation-manifold.jpg',title:'灌溉电磁阀与管路组件',caption:'包含控制阀、过滤器与管路的滴灌组件实拍参考，不代表远程阀门实况。',author:'michael / Wikimedia Commons',source:source('Uninstalled drip irrigation set up.jpg'),license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/'},
 D6:{image:'./media/devices/irrigation-valve.jpg',title:'田间灌溉阀体',caption:'机械灌溉阀体实拍参考，用于展示灌溉设施，不代表该设备具备智能控制功能。',author:'Nick Birse / Wikimedia Commons',source:source('Irrigation valve assembly.JPG'),license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',portrait:true},
 D7:{image:'./media/devices/insect-trap.jpg',title:'虫情诱捕装置',caption:'信息素诱捕装置实拍参考，不代表自动虫情识别设备的现场画面。',author:'Bj.schoenmakers',source:source('Pheromone trap, Mookerheide, the Netherlands.JPG'),license:'CC0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',portrait:true},
}
