import { gapi } from "gapi-script";

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let isInitialized = false;
let isSignedIn = false;

// Initialize Google API client
export async function initializeGoogleDrive(
  apiKey: string,
  clientId: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    gapi.load("client:auth2", async () => {
      try {
        await gapi.client.init({
          apiKey,
          clientId,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        });

        isInitialized = true;
        isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
        
        // Listen for sign-in state changes
        gapi.auth2.getAuthInstance().isSignedIn.listen((signedIn: boolean) => {
          isSignedIn = signedIn;
        });

        resolve(true);
      } catch (error) {
        console.error("Error initializing Google Drive:", error);
        reject(error);
      }
    });
  });
}

// Sign in to Google
export async function signInToGoogle(): Promise<void> {
  if (!isInitialized) {
    throw new Error("Google Drive not initialized");
  }

  try {
    await gapi.auth2.getAuthInstance().signIn();
    isSignedIn = true;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

// Sign out from Google
export async function signOutFromGoogle(): Promise<void> {
  if (!isInitialized) {
    return;
  }

  await gapi.auth2.getAuthInstance().signOut();
  isSignedIn = false;
}

// Check if signed in
export function isUserSignedIn(): boolean {
  return isSignedIn;
}

// Create folder in Drive
export async function createDriveFolder(
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  if (!isSignedIn) {
    throw new Error("Not signed in to Google Drive");
  }

  const fileMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: parentFolderId ? [parentFolderId] : [],
  };

  try {
    const response = await gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: "id",
    });

    return response.result.id;
  } catch (error) {
    console.error("Error creating folder:", error);
    throw error;
  }
}

// Check if folder exists
export async function findFolder(
  folderName: string,
  parentFolderId?: string
): Promise<string | null> {
  if (!isSignedIn) {
    throw new Error("Not signed in to Google Drive");
  }

  let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  try {
    const response = await gapi.client.drive.files.list({
      q: query,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0].id;
    }

    return null;
  } catch (error) {
    console.error("Error finding folder:", error);
    throw error;
  }
}

// Get or create folder structure for student
export async function getOrCreateStudentFolder(
  admissionNumber: string,
  rootFolderId: string
): Promise<{ studentFolderId: string; photoFolderId: string; documentsFolderId: string }> {
  // Create/Get "Students" folder
  let studentsFolderId = await findFolder("Students", rootFolderId);
  if (!studentsFolderId) {
    studentsFolderId = await createDriveFolder("Students", rootFolderId);
  }

  // Create/Get student's folder
  let studentFolderId = await findFolder(admissionNumber, studentsFolderId);
  if (!studentFolderId) {
    studentFolderId = await createDriveFolder(admissionNumber, studentsFolderId);
  }

  // Create/Get "Photo" subfolder
  let photoFolderId = await findFolder("Photo", studentFolderId);
  if (!photoFolderId) {
    photoFolderId = await createDriveFolder("Photo", studentFolderId);
  }

  // Create/Get "Documents" subfolder
  let documentsFolderId = await findFolder("Documents", studentFolderId);
  if (!documentsFolderId) {
    documentsFolderId = await createDriveFolder("Documents", studentFolderId);
  }

  return { studentFolderId, photoFolderId, documentsFolderId };
}

// Upload file to Drive
export async function uploadFileToDrive(
  file: File,
  folderId: string,
  onProgress?: (progress: number) => void
): Promise<{ fileId: string; webViewLink: string; fileName: string; size: number }> {
  if (!isSignedIn) {
    throw new Error("Not signed in to Google Drive");
  }

  const metadata = {
    name: file.name,
    parents: [folderId],
  };

  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("file", file);

  try {
    const accessToken = gapi.auth.getToken().access_token;

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            fileId: response.id,
            webViewLink: response.webViewLink || `https://drive.google.com/file/d/${response.id}/view`,
            fileName: file.name,
            size: file.size,
          });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open(
        "POST",
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink"
      );
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Delete file from Drive
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  if (!isSignedIn) {
    throw new Error("Not signed in to Google Drive");
  }

  try {
    await gapi.client.drive.files.delete({
      fileId,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

// Test Drive connection
export async function testDriveConnection(rootFolderId: string): Promise<boolean> {
  if (!isSignedIn) {
    throw new Error("Not signed in to Google Drive");
  }

  try {
    // Try to get folder details
    const response = await gapi.client.drive.files.get({
      fileId: rootFolderId,
      fields: "id, name",
    });

    return !!response.result.id;
  } catch (error) {
    console.error("Drive connection test failed:", error);
    return false;
  }
}
