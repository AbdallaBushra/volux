// src/utils/uploadHelper.js
import { storage } from "../firebase/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

/**
 * تحميل صورة إلى Firebase Storage
 * @param {File} file - ملف الصورة
 * @param {string} path - المسار في Storage
 * @param {string} uid - معرف المستخدم
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadImageToStorage = async (file, path, uid) => {
  try {
    if (!file || !uid) {
      return { success: false, error: "Missing file or user ID" };
    }

    // إنشاء اسم فريد للملف
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${uid}_${timestamp}.${extension}`;
    const storagePath = `${path}/${fileName}`;
    
    // إنشاء مرجع للـ Storage
    const storageRef = ref(storage, storagePath);
    
    // تحميل الملف
    await uploadBytes(storageRef, file);
    
    // الحصول على رابط التحميل
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log(`✅ تم تحميل الصورة: ${storagePath}`);
    return { success: true, url: downloadURL };
    
  } catch (error) {
    console.error("❌ خطأ في تحميل الصورة:", error);
    return { success: false, error: error.message };
  }
};

/**
 * حذف صورة من Firebase Storage
 * @param {string} url - رابط الصورة
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteImageFromStorage = async (url) => {
  try {
    if (!url || !url.includes("firebasestorage.googleapis.com")) {
      return { success: false, error: "Invalid URL" };
    }
    
    // استخراج المسار من الرابط
    const path = decodeURIComponent(url.split('?')[0].split('/o/')[1]);
    const storageRef = ref(storage, path);
    
    // حذف الملف
    await deleteObject(storageRef);
    
    console.log(`🗑️ تم حذف الصورة: ${path}`);
    return { success: true };
    
  } catch (error) {
    console.error("❌ خطأ في حذف الصورة:", error);
    return { success: false, error: error.message };
  }
};

/**
 * معالجة تحميل الصور أثناء التسجيل
 * @param {File} file - ملف الصورة
 * @param {string} userId - معرف المستخدم
 * @param {string} userType - نوع المستخدم
 * @returns {Promise<string>} رابط الصورة
 */
export const handleRegistrationImageUpload = async (file, userId, userType) => {
  try {
    if (!file || !userId) return "";
    
    let storagePath = "";
    switch (userType) {
      case "volunteer":
        storagePath = "profile-images/volunteers";
        break;
      case "institution":
        storagePath = "logos/institutions";
        break;
      case "team":
        storagePath = "logos/teams";
        break;
      default:
        storagePath = "uploads";
    }
    
    const result = await uploadImageToStorage(file, storagePath, userId);
    
    if (result.success) {
      console.log(`✅ تم تحميل صورة ${userType}: ${result.url}`);
      return result.url;
    }
    
    return "";
  } catch (error) {
    console.error("❌ خطأ في معالجة تحميل الصورة:", error);
    return "";
  }
};