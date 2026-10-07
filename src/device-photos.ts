import type {ReferencePhoto} from './real-media'
const source=(name:string)=>'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(name.replaceAll(' ','_'))
const pd='https://creativecommons.org/publicdomain/mark/1.0/'
const fieldPhoto=(name:string,largeWidth=1280)=>({image:`./media/devices/${name}.jpg`,preview:`./media/devices/${name}-1280.webp`,srcSet:`./media/devices/${name}-640.webp 640w, ./media/devices/${name}-1280.webp ${largeWidth}w`})
export const DEVICE_PHOTOS:Record<string,ReferencePhoto & {position?:string;preview:string;srcSet:string}>={
 D1:{...fieldPhoto('soil-logger',960),title:'田间土壤水分采集器',caption:'作物田内安装的土壤水分数据记录器实拍参考；并非本平台设备的现场照片。',author:'USDA NRCS Montana',source:source('Irrigation65 (37973074585).jpg'),license:'Public domain',licenseUrl:pd},
 D2:{...fieldPhoto('soil-cosmic'),title:'农田土壤水分监测站',caption:'农田内太阳能供电的宇宙射线土壤水分监测站实拍参考，不代表平台设备型号。',author:'Peter Haas',source:source('Cosmic Ray Sensor for soil moisture measurements-DSC 6642w.jpg'),license:'CC BY-SA 3.0 AT',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/at/',position:'50% 38%'},
 D3:{...fieldPhoto('soil-cornfield',1249),title:'玉米田墒情监测点',caption:'玉米田中部署的土壤水分监测站与校验子站实拍参考，不代表当前设备实况。',author:'USGS / Nevada Water Science Center',source:'https://www.usgs.gov/media/images/hanna-crns-soil-moisture-monitoring-station',license:'Public domain',licenseUrl:pd,position:'50% 65%'},
 D4:{...fieldPhoto('weather-vineyard'),title:'田间自动气象站',caption:'种植区田边安装的自动气象站实拍参考，不代表平台设备型号。',author:'Cjp24',source:source('Davis Instruments weather station - detail.jpg'),license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'},
 D5:{...fieldPhoto('valve-field'),title:'农田滴灌阀组',caption:'农田滴灌管线上安装的阀组实拍参考，不代表远程阀门实况。',author:'USDA NRCS Texas',source:source('Irrigation valve set for drip irrigation system being installed on Blake Davis Farms in Lamb County near Littlefield, Texas. (24746797549).jpg'),license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/'},
 D6:{...fieldPhoto('irrigation-valve'),title:'田间灌溉阀体',caption:'耕地旁的机械灌溉阀体实拍参考，不代表该设备具备智能控制功能。',author:'Nick Birse / Wikimedia Commons',source:source('Irrigation valve assembly.JPG'),license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',position:'50% 12%'},
 D7:{...fieldPhoto('trap-paddy',1024),title:'稻田虫情诱捕装置',caption:'稻田内安装的信息素诱捕器实拍参考，用于展示田间虫情监测场景，不代表自动识别设备实况。',author:'Mehdi',source:source('Pheromone insect traps - Amol - Iran 01.jpg'),license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/'},
}

