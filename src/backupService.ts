import CryptoJS from 'crypto-js';
import { doc, setDoc, getDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { firestore, handleFirestoreError, OperationType } from './auth';

// Since it's a client-side app, we'll generate a consistent key based on the user's UID to make it seamless.

export interface BackupMetadata {
  id: string;
  userId: string;
  date: string;
  time: string;
  appVersion: string;
  dbVersion: string;
  deviceName: string;
  os: string;
  size: number;
  compressionRatio: number;
  encryptionVersion: string;
  hash: string;
  status: string;
  type: 'Full' | 'Incremental';
}

export class BackupService {
  private userId: string;
  private encryptionKey: string;

  constructor(userId: string) {
    this.userId = userId;
    // For seamless UX, use the user's ID combined with a secret salt to derive an encryption key
    this.encryptionKey = CryptoJS.SHA256(`smartacc_secret_${userId}`).toString();
  }

  private encryptData(data: string): string {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  private decryptData(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private calculateHash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  private getDeviceAndOS() {
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    if (ua.indexOf('Android') !== -1) os = 'Android';
    else if (ua.indexOf('like Mac') !== -1) os = 'iOS';
    else if (ua.indexOf('Win') !== -1) os = 'Windows';
    else if (ua.indexOf('Mac') !== -1) os = 'MacOS';
    else if (ua.indexOf('Linux') !== -1) os = 'Linux';
    return {
      deviceName: navigator.platform || 'Unknown Device',
      os
    };
  }

  async uploadBackup(dbState: any, type: 'Full' | 'Incremental' = 'Full'): Promise<BackupMetadata> {
    console.log("Uploading backup for user:", this.userId);
    const rawData = JSON.stringify(dbState);
    const encryptedData = this.encryptData(rawData);
    console.log("Encrypted data size:", encryptedData.length, "bytes");
    // Firestore documents are bounded; reject oversized backups before a network write.
    if (encryptedData.length > 900_000) {
      throw new Error("النسخة الاحتياطية أكبر من الحد الآمن المسموح به للتخزين السحابي.");
    }
    const hash = this.calculateHash(encryptedData);

    const { deviceName, os } = this.getDeviceAndOS();
    const now = new Date();

    const metadata: BackupMetadata = {
      id: `backup_${now.getTime()}`,
      userId: this.userId,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      appVersion: '1.0.0',
      dbVersion: '1.0',
      deviceName,
      os,
      size: encryptedData.length,
      compressionRatio: 1, // Simplified for now
      encryptionVersion: 'AES-256',
      hash,
      status: 'success',
      type
    };

    try {
      const backupDocRef = doc(firestore, 'user_backups', this.userId, 'backups_store', metadata.id);
      console.log("Attempting to write document to:", backupDocRef.path);
      await setDoc(backupDocRef, {
        id: metadata.id,
        userId: this.userId,
        metadata,
        encryptedData,
        createdAt: now.toISOString()
      });
      console.log("Backup upload successful.");
      return metadata;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `user_backups/${this.userId}/backups_store/${metadata.id}`);
      throw err;
    }
  }

  async listBackups(): Promise<{ driveId: string, metadata: BackupMetadata }[]> {
    console.log("Listing backups for user:", this.userId);
    try {
      const colRef = collection(firestore, 'user_backups', this.userId, 'backups_store');
      const snapshot = await getDocs(colRef);

      const backups = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          driveId: docSnap.id,
          metadata: data.metadata as BackupMetadata
        };
      });

      return backups.sort((a, b) => new Date(`${b.metadata.date}T${b.metadata.time}`).getTime() - new Date(`${a.metadata.date}T${a.metadata.time}`).getTime());
    } catch (err: any) {
      handleFirestoreError(err, OperationType.LIST, `user_backups/${this.userId}/backups_store`);
      throw err;
    }
  }

  async downloadBackup(driveId: string): Promise<any> {
    try {
      const docRef = doc(firestore, 'user_backups', this.userId, 'backups_store', driveId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("النسخة الاحتياطية المطلوبة غير موجودة");
      }
      const data = docSnap.data();
      if (typeof data.encryptedData !== 'string' || typeof data.metadata?.hash !== 'string') {
        throw new Error("النسخة الاحتياطية غير صالحة");
      }
      if (this.calculateHash(data.encryptedData) !== data.metadata.hash) {
        throw new Error("سلامة النسخة الاحتياطية غير صالحة");
      }
      const decryptedStr = this.decryptData(data.encryptedData);
      return JSON.parse(decryptedStr);
    } catch (e: any) {
      if (e.message && e.message.includes("النسخة الاحتياطية")) throw e;
      handleFirestoreError(e, OperationType.GET, `user_backups/${this.userId}/backups_store/${driveId}`);
      throw new Error("فشل تحميل أو فك تشفير النسخة الاحتياطية (تالفة أو مفتاح خاطئ)");
    }
  }

  async deleteBackup(driveId: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'user_backups', this.userId, 'backups_store', driveId);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `user_backups/${this.userId}/backups_store/${driveId}`);
      throw new Error("فشل حذف النسخة الاحتياطية");
    }
  }
}
