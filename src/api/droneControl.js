import { requestData } from "@/utils/request.js";

/**
 * 无人机手动操控 / 任务控制相关接口
 */
export class DroneControlService {
  /**
   * 暂停任务
   * @param {string} serialNumber 无人机 SN
   */
  static taskSuspension(serialNumber) {
    return requestData(
      "/taskSuspension",
      { serialNumber: String(serialNumber || "").trim() },
      "POST",
      "application/json",
    );
  }

  /**
   * 恢复任务
   * @param {string} serialNumber 无人机 SN
   */
  static recoveryTask(serialNumber) {
    return requestData(
      "/recoveryTask",
      { serialNumber: String(serialNumber || "").trim() },
      "POST",
      "application/json",
    );
  }

  /**
   * 切换镜头
   * @param {{ airportSn: string, cameraSn: string, cameraType: 'ir'|'normal'|'wide'|'zoom' }} params
   */
  static changeLens({ airportSn, cameraSn, cameraType }) {
    return requestData(
      "/changeLens",
      {
        airportSn: String(airportSn || "").trim(),
        cameraSn: String(cameraSn || "").trim(),
        cameraType: String(cameraType || "").trim(),
      },
      "POST",
      "application/json",
    );
  }

  /**
   * 相机变焦
   * @param {{ serialNumber: string, zoomRatio: number }} params
   */
  static cameraZoom({ serialNumber, zoomRatio }) {
    return requestData(
      "/cameraZoom",
      {
        serialNumber: String(serialNumber || "").trim(),
        zoomRatio: Number(zoomRatio),
      },
      "POST",
      "application/json",
    );
  }

  /**
   * 无人机姿态 / 位移控制
   * @param {{ serialNumber: string, actionType: number, pfs: number }} params
   */
  static droneHeight({ serialNumber, actionType, pfs }) {
    return requestData(
      "/droneHeight",
      {
        serialNumber: String(serialNumber || "").trim(),
        actionType: Number(actionType),
        pfs: Number(pfs),
      },
      "POST",
      "application/json",
    );
  }

  /**
   * 云台姿态调整
   * @param {{ serialNumber: string, pitchAngle: number, pitchingMotion: number }} params
   */
  static gimbalPostureAdjustment({ serialNumber, pitchAngle, pitchingMotion }) {
    return requestData(
      "/gimbalPostureAdjustment",
      {
        serialNumber: String(serialNumber || "").trim(),
        pitchAngle: Number(pitchAngle),
        pitchingMotion: Number(pitchingMotion),
      },
      "POST",
      "application/json",
    );
  }
}
