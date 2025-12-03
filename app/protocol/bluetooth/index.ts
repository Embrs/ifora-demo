/// <reference types="web-bluetooth" />
/**
 * 藍牙健康讀取模組，封裝與心率、血氧等 BLE 裝置互動的常用流程。
 * 主要利用 Web Bluetooth API 與標準 GATT Service / Characteristic 進行連線與資料解析。
 */

// -- 常數 ---------------------------------------------------------------------------------------------------
/** 心率服務 UUID。*/
export const HEART_RATE_SERVICE_UUID: BluetoothServiceUUID = 0x180d;
/** 心率量測特徵 UUID。*/
export const HEART_RATE_MEASUREMENT_CHAR_UUID: BluetoothCharacteristicUUID = 0x2a37;

/** 血氧服務 UUID（Pulse Oximeter Service）。*/
export const PULSE_OXIMETER_SERVICE_UUID: BluetoothServiceUUID = 0x1822;
/** 血氧連續量測特徵 UUID。*/
export const PULSE_OXIMETER_CONTINUOUS_CHAR_UUID: BluetoothCharacteristicUUID = 0x2a5f;
/** 血氧即時量測（Spot-Check）特徵 UUID。*/
export const PULSE_OXIMETER_SPOT_CHECK_CHAR_UUID: BluetoothCharacteristicUUID = 0x2a5e;

/** 電量服務 UUID，可作為附加資料來源。*/
export const BATTERY_SERVICE_UUID: BluetoothServiceUUID = 0x180f;

/** FORA/TaiDoc 自定義服務 UUID。*/
export const FORA_CUSTOM_SERVICE_UUID: BluetoothServiceUUID = '00001523-1212-efde-1523-785feabcd123';
/** FORA/TaiDoc 自定義特徵 UUID。*/
export const FORA_CUSTOM_CHAR_UUID: BluetoothCharacteristicUUID = '00001524-1212-efde-1523-785feabcd123';

/** Acare 血氧儀的主要自定義服務 UUID（從 nRF Connect 發現的實際 UUID）。*/
export const ACARE_CUSTOM_SERVICE_UUID: BluetoothServiceUUID = '0000aaaa-0000-1000-8000-00805f9b34fb';
/** Acare 血氧儀的數據通知特徵 UUID（支援 NOTIFY）。*/
export const ACARE_CUSTOM_CHAR_UUID: BluetoothCharacteristicUUID = '0000aaac-0000-1000-8000-00805f9b34fb';
/** Acare 血氧儀的指令寫入特徵 UUID（支援 WRITE WITHOUT RESPONSE）。*/
export const ACARE_COMMAND_CHAR_UUID: BluetoothCharacteristicUUID = '0000aaab-0000-1000-8000-00805f9b34fb';

/** Acare 血氧儀的第二個自定義服務 UUID（可能用於額外控制）。*/
export const ACARE_SECONDARY_SERVICE_UUID: BluetoothServiceUUID = '1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0';
/** Acare 血氧儀的第二個服務的寫入特徵 UUID。*/
export const ACARE_SECONDARY_CHAR_UUID: BluetoothCharacteristicUUID = 'f7bf3564-fb6d-4e53-88a4-5e37e0326063';

/** 常見的自定義服務 UUID（許多中國製造商使用）。*/
export const COMMON_CUSTOM_SERVICE_UUIDS: BluetoothServiceUUID[] = [
  0xffe0, // 常見的自定義服務
  0xffe1,
  0xffe5, // 另一個常見的自定義服務
  0xfff0, // 健康裝置常用
  0xfff1,
  0xfff2,
  0xfff3,
  0xfff4,
  0xfff5,
  0xfff6,
  0xfff7,
  0xfff8,
  0xfff9,
  0xfffa,
  0xfffb,
  0xfffc,
  0xfffd,
  0xfffe,
  0xffff,
  0x1523, // 某些血氧儀使用
  0x1524,
  0x180a, // Device Information Service
  0x180f, // Battery Service
  '00001523-1212-efde-1523-785feabcd123', // TaiDoc/FORA 可能使用的 UUID
  '00001524-1212-efde-1523-785feabcd123',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000ffe5-0000-1000-8000-00805f9b34fb',
  '0000fff1-0000-1000-8000-00805f9b34fb',
  '0000fff2-0000-1000-8000-00805f9b34fb',
  '0000fff3-0000-1000-8000-00805f9b34fb',
  '0000fff4-0000-1000-8000-00805f9b34fb',
  '0000fff5-0000-1000-8000-00805f9b34fb',
  '0000fff6-0000-1000-8000-00805f9b34fb',
  '0000fff7-0000-1000-8000-00805f9b34fb',
  '0000fff8-0000-1000-8000-00805f9b34fb',
  '0000fff9-0000-1000-8000-00805f9b34fb',
  '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
  // Acare 實際使用的 UUID（從 nRF Connect 發現）
  '0000aaaa-0000-1000-8000-00805f9b34fb', // Acare 血氧儀主要數據服務
  '1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0', // Acare 血氧儀第二個服務
  // 添加更多可能的 Acare 專用 UUID
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip Transparent UART
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service
];

// -- 型別 ---------------------------------------------------------------------------------------------------
/** 心率量測資料結構。*/
export interface HeartRateMeasurement {
  heartRate: number | null;
  contactDetected: boolean;
  energyExpended?: number | null;
  rrIntervals?: number[];
  raw: DataView;
}

/** 血氧量測資料結構。*/
export interface PulseOximeterMeasurement {
  spo2: number | null;
  heartRate: number | null;
  raw: DataView;
}

/** FORA 自定義量測資料結構。*/
export interface ForaCustomMeasurement {
  spo2: number | null;
  heartRate: number | null;
  raw: DataView;
  /** 原始十六進位字串，用於調試。*/
  hexString: string;
}

/** 擴充後的藍牙裝置請求參數，方便在程式內進行條件檢查。*/
type EnhancedRequestDeviceOptions = RequestDeviceOptions & {
  filters?: BluetoothLEScanFilter[];
  acceptAllDevices?: boolean;
};

/** BLE 連線情境資料。*/
export interface BluetoothHealthContext {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  heartRateCharacteristic: BluetoothRemoteGATTCharacteristic | null;
  pulseOximeterCharacteristic: BluetoothRemoteGATTCharacteristic | null;
  /** FORA/TaiDoc 自定義特徵（用於 TD-8255 等裝置）。*/
  foraCustomCharacteristic: BluetoothRemoteGATTCharacteristic | null;
  /** Acare 主要數據通知特徵（用於 AE-K1 等裝置）。*/
  acareCustomCharacteristic: BluetoothRemoteGATTCharacteristic | null;
  /** Acare 指令寫入特徵（用於發送控制指令）。*/
  acareCommandCharacteristic: BluetoothRemoteGATTCharacteristic | null;
  /** Acare 第二個服務的寫入特徵（可能用於額外控制）。*/
  acareSecondaryCharacteristic: BluetoothRemoteGATTCharacteristic | null;
}

/** 特徵通知解除函式。*/
export type BluetoothNotificationStopper = () => Promise<void>;

// -- 工具函式 -----------------------------------------------------------------------------------------------
/** 確認當前環境是否支援 Web Bluetooth API。*/
export const isBluetoothSupported = (): boolean => typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);

/** 取得藍牙物件，若不支援則拋出錯誤。*/
const ensureBluetooth = (): Bluetooth => {
  if (typeof navigator === 'undefined' || !navigator.bluetooth) {
    throw new Error('此環境不支援 Web Bluetooth API，請改用支援的瀏覽器 (如 Chrome 專案)。');
  }
  return navigator.bluetooth;
};

/**
 * 建立預設的裝置搜尋條件，提供心率與血氧裝置所需的服務 UUID。
 * 包含標準服務與常見的自定義服務 UUID。
 */
const createDefaultRequestOptions = (): EnhancedRequestDeviceOptions => ({
  acceptAllDevices: true,
  optionalServices: [
    HEART_RATE_SERVICE_UUID,
    PULSE_OXIMETER_SERVICE_UUID,
    BATTERY_SERVICE_UUID,
    ...COMMON_CUSTOM_SERVICE_UUIDS
  ]
});

/** 解析 SFLOAT 型別（Bluetooth GATT 常用格式）。*/
const parseSfloat = (view: DataView, offset: number): number | null => {
  if (offset + 2 > view.byteLength) {
    return null;
  }
  const raw = view.getUint16(offset, true);
  if (raw === 0x07ff) {
    return null; // 0x07FF 為無效資料代碼
  }
  let mantissa = raw & 0x0fff;
  if (mantissa >= 0x0800) {
    mantissa = -((0x0fff + 1) - mantissa);
  }
  let exponent = raw >> 12;
  if (exponent >= 0x0008) {
    exponent = -((0x000f + 1) - exponent);
  }
  return mantissa * Math.pow(10, exponent);
};

/** 解析心率量測資料。*/
export const parseHeartRateMeasurement = (view: DataView): HeartRateMeasurement => {
  const flags = view.getUint8(0);
  const isUint16 = (flags & 0x1) === 0x1;
  const contactDetected = (flags & 0x2) === 0x2;
  const energyPresent = (flags & 0x8) === 0x8;
  const rrPresent = (flags & 0x10) === 0x10;

  let offset = 1;
  const heartRate = isUint16 ? view.getUint16(offset, true) : view.getUint8(offset);
  offset += isUint16 ? 2 : 1;

  let energyExpended: number | null = null;
  if (energyPresent && offset + 2 <= view.byteLength) {
    energyExpended = view.getUint16(offset, true);
    offset += 2;
  }

  const rrIntervals: number[] = [];
  if (rrPresent) {
    while (offset + 1 < view.byteLength) {
      const rr = view.getUint16(offset, true) / 1024; // 轉換為秒
      rrIntervals.push(rr);
      offset += 2;
    }
  }

  return {
    heartRate,
    contactDetected,
    energyExpended,
    rrIntervals: rrIntervals.length ? rrIntervals : undefined,
    raw: view
  };
};

/** 嘗試解析血氧量測資料。*/
export const parsePulseOximeterMeasurement = (view: DataView): PulseOximeterMeasurement => {
  // Flags 佔 16 bits
  if (view.byteLength < 4) {
    return {
      spo2: null,
      heartRate: null,
      raw: view
    };
  }

  const spo2 = parseSfloat(view, 2);
  const heartRate = parseSfloat(view, 4);

  return {
    spo2: Number.isFinite(spo2 ?? NaN) ? spo2 : null,
    heartRate: Number.isFinite(heartRate ?? NaN) ? heartRate : null,
    raw: view
  };
};

/**
 * 解析 FORA 自定義量測資料。
 * 根據 TD-8255 的數據格式進行解析。
 */
export const parseForaCustomMeasurement = (view: DataView): ForaCustomMeasurement => {
  const hexString = Array.from(new Uint8Array(view.buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');

  console.log(`[bluetooth] FORA 原始數據 (${view.byteLength} bytes): ${hexString}`);

  // FORA TD-8255 的典型數據格式（根據常見血氧儀格式推測）：
  // Byte 0: SpO2 值
  // Byte 1: 心率值
  // 其他 bytes: 狀態標誌或額外資訊
  
  let spo2: number | null = null;
  let heartRate: number | null = null;

  if (view.byteLength >= 2) {
    const byte0 = view.getUint8(0);
    const byte1 = view.getUint8(1);

    // SpO2 通常在 70-100 之間
    if (byte0 >= 70 && byte0 <= 100) {
      spo2 = byte0;
    }
    // 心率通常在 30-250 之間
    if (byte1 >= 30 && byte1 <= 250) {
      heartRate = byte1;
    }

    // 嘗試反向解析（有些裝置可能顛倒順序）
    if (spo2 === null && byte1 >= 70 && byte1 <= 100) {
      spo2 = byte1;
    }
    if (heartRate === null && byte0 >= 30 && byte0 <= 250) {
      heartRate = byte0;
    }

    console.log(`[bluetooth] FORA 解析結果: SpO2=${spo2}, 心率=${heartRate}`);
  }

  return {
    spo2,
    heartRate,
    raw: view,
    hexString
  };
};

/**
 * 解析 Acare 自定義量測資料（用於 AE-K1 等設備）。
 * Acare 血氧機可能使用不同的數據格式。
 */
export const parseAcareCustomMeasurement = (view: DataView): ForaCustomMeasurement => {
  const hexString = Array.from(new Uint8Array(view.buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');

  let spo2: number | null = null;
  let heartRate: number | null = null;

  if (view.byteLength >= 2) {
    const bytes: number[] = [];
    for (let i = 0; i < view.byteLength; i++) {
      bytes.push(view.getUint8(i));
    }

    // 格式 0: BerryMed/Oxycare 5字節協議（最常見的低成本血氧機協議）
    // 數據包格式: [狀態, 保留, 波形+心率高位, 心率低7位, SpO2]
    if (view.byteLength === 5) {
      const byte0 = bytes[0]; // 狀態字節
      const byte1 = bytes[1]; // 保留
      const byte2 = bytes[2]; // 波形數據 + 心率高位 (bit 6)
      const byte3 = bytes[3]; // 心率低 7 位
      const byte4 = bytes[4]; // SpO2
      
      if (byte2 !== undefined && byte3 !== undefined && byte4 !== undefined) {
        // SpO2 在第 5 個字節
        const possibleSpo2 = byte4;
        // 心率計算: byte[3] 的低 7 位 + byte[2] 的 bit 6 作為第 8 位
        const possiblePR = byte3 | ((byte2 & 0x40) << 1);
        
        if (possibleSpo2 >= 70 && possibleSpo2 <= 100 && possiblePR >= 30 && possiblePR <= 250) {
          spo2 = possibleSpo2;
          heartRate = possiblePR;
          console.log(`[bluetooth] BerryMed格式 - SpO2: ${spo2}%, 心率: ${heartRate} bpm`);
        }
      }
    }

    // 嘗試其他通用格式
    if (spo2 === null && heartRate === null && view.byteLength >= 3) {
      // 格式 A: [Header, SpO2, PR] - 常見格式
      const byte1 = bytes[1];
      const byte2 = bytes[2];
      if (byte1 !== undefined && byte2 !== undefined &&
          byte1 >= 70 && byte1 <= 100 && byte2 >= 30 && byte2 <= 250) {
        spo2 = byte1;
        heartRate = byte2;
        console.log(`[bluetooth] 標準格式 - SpO2: ${spo2}%, 心率: ${heartRate} bpm`);
      }
    }

    // 記錄解析失敗的情況
    if (spo2 === null && heartRate === null) {
      console.warn(`[bluetooth] 無法解析數據 (${view.byteLength} bytes): 0x${hexString}`);
    }
  }

  return {
    spo2,
    heartRate,
    raw: view,
    hexString
  };
};

/**
 * 取得指定服務與特徵，若不存在則回傳 null。
 */
const getOptionalCharacteristic = async(
  server: BluetoothRemoteGATTServer,
  serviceUuid: BluetoothServiceUUID,
  characteristicUuid: BluetoothCharacteristicUUID
): Promise<BluetoothRemoteGATTCharacteristic | null> => {
  try {
    const service = await server.getPrimaryService(serviceUuid);
    return await service.getCharacteristic(characteristicUuid);
  }
  catch (error) {
    // 靜默處理，不顯示警告（裝置可能不支援標準服務）
    return null;
  }
};

/**
 * 启動通知並回傳解除監聽函式。
 */
const startNotifications = async<T>(
  characteristic: BluetoothRemoteGATTCharacteristic,
  parser: (view: DataView) => T,
  callback: (measurement: T) => void
): Promise<BluetoothNotificationStopper> => {
  const handleChange = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic | null;
    const value = target?.value;
    if (!value) {
      console.warn('[bluetooth] 收到空通知事件');
      return;
    }
    
    try {
      const parsed = parser(value);
      callback(parsed);
    }
    catch (error) {
      console.error('[bluetooth] 數據解析失敗', error);
    }
  };

  // 先註冊事件監聽器，再啟動通知
  characteristic.addEventListener('characteristicvaluechanged', handleChange);
  await characteristic.startNotifications();

  return async() => {
    characteristic.removeEventListener('characteristicvaluechanged', handleChange);
    try {
      await characteristic.stopNotifications();
    }
    catch (error) {
      console.warn('[bluetooth] 停止通知時發生警告', error);
    }
  };
};

// -- 對外函式 -----------------------------------------------------------------------------------------------
/**
 * 透過 Web Bluetooth 搜尋並請使用者選擇健康量測裝置。
 * @param options 自定義請求選項
 * @param deviceNamePrefix 裝置名稱前綴過濾（例如："TD-8255" 或 "FORA"）
 */
export const requestHealthDevice = async(
  options?: RequestDeviceOptions,
  deviceNamePrefix?: string
): Promise<BluetoothDevice> => {
  const bluetooth = ensureBluetooth();
  
  let requestOptions: EnhancedRequestDeviceOptions;
  
  if (options) {
    requestOptions = { ...options };
  }
  else if (deviceNamePrefix) {
    // 使用裝置名稱過濾器，這樣可以在配對時看到裝置廣播的服務
    requestOptions = {
      filters: [{ namePrefix: deviceNamePrefix }],
      optionalServices: [
        HEART_RATE_SERVICE_UUID,
        PULSE_OXIMETER_SERVICE_UUID,
        BATTERY_SERVICE_UUID,
        ...COMMON_CUSTOM_SERVICE_UUIDS
      ]
    };
  }
  else {
    requestOptions = createDefaultRequestOptions();
  }

  const hasFilters = Array.isArray(requestOptions.filters) && requestOptions.filters.length > 0;

  if (!requestOptions.acceptAllDevices && !hasFilters) {
    // 沒有 filters 會導致例外，預設允許所有裝置並搭配 optional services。
    requestOptions.acceptAllDevices = true;
  }

  return await bluetooth.requestDevice(requestOptions);
};

/**
 * 與指定裝置建立 GATT 連線並嘗試取得心率與血氧特徵。
 */
export const connectHealthDevice = async(device: BluetoothDevice): Promise<BluetoothHealthContext> => {
  if (!device.gatt) {
    throw new Error('選取的裝置不支援 GATT 連線，無法取得資料。');
  }

  const server = await device.gatt.connect();
  
  // 嘗試取得標準心率特徵
  const heartRateCharacteristic = await getOptionalCharacteristic(server, HEART_RATE_SERVICE_UUID, HEART_RATE_MEASUREMENT_CHAR_UUID);

  // 嘗試取得標準血氧特徵（連續量測）
  console.log('[bluetooth] 嘗試取得標準血氧服務 (0x1822)...');
  const pulseOximeterCharacteristic = await getOptionalCharacteristic(server, PULSE_OXIMETER_SERVICE_UUID, PULSE_OXIMETER_CONTINUOUS_CHAR_UUID);
  
  // 如果連續量測失敗，嘗試 Spot-Check
  if (!pulseOximeterCharacteristic) {
    console.log('[bluetooth] 連續量測特徵不存在，嘗試 Spot-Check 特徵...');
    const spotCheckChar = await getOptionalCharacteristic(server, PULSE_OXIMETER_SERVICE_UUID, PULSE_OXIMETER_SPOT_CHECK_CHAR_UUID);
    if (spotCheckChar) {
      console.log('[bluetooth] ✓ 找到標準血氧 Spot-Check 服務');
    }
  }
  // 嘗試取得 FORA/TaiDoc 自定義特徵
  const foraCustomCharacteristic = await getOptionalCharacteristic(server, FORA_CUSTOM_SERVICE_UUID, FORA_CUSTOM_CHAR_UUID);

  // 嘗試取得 Acare 自定義特徵
  const acareCustomCharacteristic = await getOptionalCharacteristic(server, ACARE_CUSTOM_SERVICE_UUID, ACARE_CUSTOM_CHAR_UUID);
  const acareCommandCharacteristic = await getOptionalCharacteristic(server, ACARE_CUSTOM_SERVICE_UUID, ACARE_COMMAND_CHAR_UUID);
  const acareSecondaryCharacteristic = await getOptionalCharacteristic(server, ACARE_SECONDARY_SERVICE_UUID, ACARE_SECONDARY_CHAR_UUID);

  // 報告找到的服務（優先報告標準服務）
  if (heartRateCharacteristic) {
    console.log('[bluetooth] ✓ 找到標準心率服務 (0x180D)');
  }
  if (pulseOximeterCharacteristic) {
    console.log('[bluetooth] ✓ 找到標準血氧服務 (0x1822)');
  }
  if (foraCustomCharacteristic) {
    console.log('[bluetooth] ✓ 找到 FORA 自定義服務');
  }
  if (acareCustomCharacteristic) {
    console.log('[bluetooth] ✓ 找到 Acare 自定義服務');
    if (acareSecondaryCharacteristic) {
      console.log('[bluetooth] ✓ 找到 Acare 第二服務');
    }
  }
  
  // 如果都找不到，列出所有可用服務供調試
  if (!heartRateCharacteristic && !pulseOximeterCharacteristic && !foraCustomCharacteristic && !acareCustomCharacteristic) {
    console.warn('[bluetooth] 未找到任何支持的服務，嘗試列出所有可用服務...');
    try {
      const services = await server.getPrimaryServices();
      console.log(`[bluetooth] 裝置提供 ${services.length} 個服務：`);
      for (const service of services) {
        console.log(`  - 服務 UUID: ${service.uuid}`);
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            console.log(`    特徵 UUID: ${char.uuid}, 屬性:`, char.properties);
          }
        }
        catch (e) {
          console.log(`    無法列出特徵: ${e}`);
        }
      }
    }
    catch (e) {
      console.warn('[bluetooth] 無法列出服務:', e);
    }
  }

  return {
    device,
    server,
    heartRateCharacteristic,
    pulseOximeterCharacteristic,
    foraCustomCharacteristic,
    acareCustomCharacteristic,
    acareCommandCharacteristic,
    acareSecondaryCharacteristic
  };
};

/**
 * 啟動心率特徵通知。
 */
export const startHeartRateNotifications = async(
  characteristic: BluetoothRemoteGATTCharacteristic,
  callback: (measurement: HeartRateMeasurement) => void
): Promise<BluetoothNotificationStopper> => startNotifications(characteristic, parseHeartRateMeasurement, callback);

/**
 * 立即讀取一次心率值。
 */
export const readHeartRateOnce = async(
  characteristic: BluetoothRemoteGATTCharacteristic
): Promise<HeartRateMeasurement> => {
  const value = await characteristic.readValue();
  return parseHeartRateMeasurement(value);
};

/**
 * 啟動血氧特徵通知，支援連續與即時量測。
 */
export const startPulseOximeterNotifications = async(
  characteristic: BluetoothRemoteGATTCharacteristic,
  callback: (measurement: PulseOximeterMeasurement) => void
): Promise<BluetoothNotificationStopper> => startNotifications(characteristic, parsePulseOximeterMeasurement, callback);

/**
 * 立即讀取一次血氧值。
 */
export const readPulseOximeterOnce = async(
  characteristic: BluetoothRemoteGATTCharacteristic
): Promise<PulseOximeterMeasurement> => {
  const value = await characteristic.readValue();
  return parsePulseOximeterMeasurement(value);
};

/**
 * 啟動 FORA 自定義特徵通知。
 */
export const startForaCustomNotifications = async(
  characteristic: BluetoothRemoteGATTCharacteristic,
  callback: (measurement: ForaCustomMeasurement) => void
): Promise<BluetoothNotificationStopper> => {
  console.log('[bluetooth] 啟動 FORA 自定義通知...');
  console.log('[bluetooth] 特徵屬性:', {
    read: characteristic.properties.read,
    write: characteristic.properties.write,
    writeWithoutResponse: characteristic.properties.writeWithoutResponse,
    notify: characteristic.properties.notify,
    indicate: characteristic.properties.indicate
  });
  
  // 先啟動通知，再寫入指令（有些裝置需要這個順序）
  console.log('[bluetooth] 開始啟動通知監聽...');
  const stopper = await startNotifications(characteristic, parseForaCustomMeasurement, callback);
  console.log('[bluetooth] ✓ FORA 通知監聽已啟動');
  
  // FORA 裝置可能需要寫入啟動指令來觸發數據傳送
  try {
    if (characteristic.properties.write) {
      console.log('[bluetooth] 嘗試寫入各種啟動指令...');
      
      // 嘗試多種常見的啟動指令序列
      const startCommandSequences: Uint8Array[][] = [
        [new Uint8Array([0x01])],                              // 單個 0x01
        [new Uint8Array([0x00])],                              // 單個 0x00
        [new Uint8Array([0x01, 0x00])],                        // 0x01 0x00
        [new Uint8Array([0x00, 0x01])],                        // 0x00 0x01
        [new Uint8Array([0x57, 0x01])],                        // FORA 可能的啟動指令
        [new Uint8Array([0xAA, 0x55])],                        // 常見的喚醒序列
        [new Uint8Array([0x01]), new Uint8Array([0x01])],      // 連續兩次 0x01
        [new Uint8Array([0xFD, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x02])], // 某些血氧儀的指令
      ];
      
      for (let i = 0; i < startCommandSequences.length; i++) {
        const sequence = startCommandSequences[i];
        try {
          if(!sequence) continue;
          for (const cmd of sequence) {
            await characteristic.writeValue(cmd as BufferSource);
            const hexCmd = Array.from(cmd).map((b) => `0x${b.toString(16).padStart(2, '0')}`).join(' ');
            console.log(`[bluetooth] 已寫入指令 #${i + 1}: ${hexCmd}`);
            // 短暫延遲
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          console.log(`[bluetooth] ✓ 指令序列 #${i + 1} 寫入完成，等待裝置回應...`);
          break; // 成功就停止
        }
        catch (e) {
          console.log(`[bluetooth] 指令序列 #${i + 1} 失敗: ${e}`);
          if (i === startCommandSequences.length - 1) {
            console.warn('[bluetooth] 所有啟動指令都失敗了');
          }
        }
      }
    }
    else {
      console.warn('[bluetooth] 特徵不支援寫入，無法發送啟動指令');
    }
  }
  catch (error) {
    console.warn('[bluetooth] 寫入啟動指令時發生錯誤:', error);
  }
  
  console.log('[bluetooth] 提示：請將手指放在感測器上，裝置應該會開始傳送數據');
  console.log('[bluetooth] 💡 如果沒有收到數據，請嘗試：');
  console.log('[bluetooth]   1. 在裝置上按測量按鈕');
  console.log('[bluetooth]   2. 移除手指後重新放置');
  console.log('[bluetooth]   3. 使用頁面上的「手動發送指令」功能嘗試其他指令');
  
  // 驗證通知是否真的啟動
  setTimeout(() => {
    console.log('[bluetooth] [5秒後檢查] 通知狀態檢查...');
    if (characteristic.properties.notify) {
      console.log('[bluetooth] ✓ 特徵支援通知');
    }
    else {
      console.warn('[bluetooth] ✗ 特徵不支援通知');
    }
    console.log('[bluetooth] 如果仍無數據，裝置可能需要：');
    console.log('[bluetooth]   - 按下裝置上的特定按鈕');
    console.log('[bluetooth]   - 或使用製造商專用的 APP 配對流程');
  }, 5000);
  
  return stopper;
};

/**
 * 主動讀取 FORA 自定義特徵的數據（用於不支援 notify 的情況）。
 */
export const readForaCustomOnce = async(
  characteristic: BluetoothRemoteGATTCharacteristic
): Promise<ForaCustomMeasurement> => {
  console.log('[bluetooth] 嘗試主動讀取 FORA 數據...');
  
  // 如果支援 write，先寫入讀取指令
  if (characteristic.properties.write) {
    try {
      await characteristic.writeValue(new Uint8Array([0x02])); // 0x02 可能是讀取指令
      console.log('[bluetooth] 已寫入讀取指令');
      // 等待裝置處理
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    catch (e) {
      console.warn('[bluetooth] 寫入讀取指令失敗:', e);
    }
  }
  
  if (characteristic.properties.read) {
    const value = await characteristic.readValue();
    return parseForaCustomMeasurement(value);
  }
  
  throw new Error('特徵不支援讀取操作');
};

/**
 * 啟動 Acare 自定義特徵通知（用於 AE-K1 等設備）。
 * @param dataCharacteristic 數據通知特徵 (0xAAAC) - 用於接收測量數據
 * @param commandCharacteristic 指令寫入特徵 (0xAAAB) - 用於發送控制指令（可選）
 * @param secondaryCharacteristic 第二個服務的寫入特徵 - 可能用於啟動（可選）
 * @param callback 數據回調函數
 */
export const startAcareCustomNotifications = async(
  dataCharacteristic: BluetoothRemoteGATTCharacteristic,
  commandCharacteristic: BluetoothRemoteGATTCharacteristic | null,
  callback: (measurement: ForaCustomMeasurement) => void,
  secondaryCharacteristic?: BluetoothRemoteGATTCharacteristic | null
): Promise<BluetoothNotificationStopper> => {
  // 啟動通知監聽
  const stopper = await startNotifications(dataCharacteristic, parseAcareCustomMeasurement, callback);
  console.log('[bluetooth] Acare 通知已啟動');
  
  // 注意：某些 Acare 設備不支持通過 GATT 通知主動推送數據
  // 如果沒有收到數據，可能需要專用 APP 或原生應用程式
  
  return stopper;
};

/**
 * 主動讀取 Acare 自定義特徵的數據（用於不支援 notify 的情況）。
 */
export const readAcareCustomOnce = async(
  characteristic: BluetoothRemoteGATTCharacteristic
): Promise<ForaCustomMeasurement> => {
  console.log('[bluetooth] 嘗試主動讀取 Acare 數據...');
  
  // 如果支援 write，先寫入讀取指令
  if (characteristic.properties.write) {
    try {
      await characteristic.writeValue(new Uint8Array([0x02]) as BufferSource);
      console.log('[bluetooth] 已寫入讀取指令');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    catch (e) {
      console.warn('[bluetooth] 寫入讀取指令失敗:', e);
    }
  }
  
  if (characteristic.properties.read) {
    const value = await characteristic.readValue();
    return parseAcareCustomMeasurement(value);
  }
  
  throw new Error('特徵不支援讀取操作');
};

/**
 * 中斷裝置連線。
 */
export const disconnectDevice = async(device: BluetoothDevice | null | undefined): Promise<void> => {
  if (!device?.gatt) {
    return;
  }
  if (device.gatt.connected) {
    device.gatt.disconnect();
  }
};

/**
 * 探索裝置的所有服務與特徵，用於調試與了解裝置結構。
 */
export const exploreDeviceServices = async(device: BluetoothDevice): Promise<void> => {
  if (!device.gatt) {
    console.warn('[bluetooth] 裝置不支援 GATT');
    return;
  }

  try {
    const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
    console.log('[bluetooth] 開始探索裝置服務...');

    const services = await server.getPrimaryServices();
    console.log(`[bluetooth] 找到 ${services.length} 個服務：`);

    for (const service of services) {
      console.log(`\n[bluetooth] 服務 UUID: ${service.uuid}`);

      try {
        const characteristics = await service.getCharacteristics();
        console.log(`  特徵數量: ${characteristics.length}`);

        for (const char of characteristics) {
          const props = char.properties;
          console.log(`  - 特徵 UUID: ${char.uuid}`);
          console.log(`    屬性: read=${props.read}, write=${props.write}, notify=${props.notify}, indicate=${props.indicate}`);

          // 嘗試讀取支援 read 的特徵
          if (props.read) {
            try {
              const value = await char.readValue();
              console.log(`    值 (hex): ${Array.from(new Uint8Array(value.buffer)).map((b) => b.toString(16).padStart(2, '0')).join(' ')}`);
            }
            catch (readError) {
              console.log(`    讀取失敗: ${readError}`);
            }
          }
        }
      }
      catch (charError) {
        console.warn(`  無法取得特徵列表: ${charError}`);
      }
    }

    console.log('\n[bluetooth] 服務探索完成');
  }
  catch (error) {
    console.error('[bluetooth] 探索服務時發生錯誤:', error);
  }
};

/** 轉換錯誤訊息為適合顯示的文字。*/
export const normalizeBluetoothError = (error: unknown): string => {
  if (!error) {
    return '未知錯誤';
  }
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotFoundError':
        return '沒有找到符合條件的藍牙裝置。';
      case 'NotSupportedError':
        return '此裝置或瀏覽器不支援所要求的藍牙功能。';
      case 'SecurityError':
        return '藍牙權限被拒絕，請確認已授權使用藍牙。';
      default:
        return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};
