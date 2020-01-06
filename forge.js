module.exports = {
  "packagerConfig": {
    "icon": "./icon",
    "osxSign": {
      "identity": "Developer ID Application: Jason Stallings (75EGRT7282)"
    },
    "osxSign": {
      "entitlements": "./default.entitlements.darwin.plist",
      "entitlements-inherit": "./default.entitlements.darwin.plist",
    },
    "appBundleId": 'com.octalmage.tewkenaire',
    "osxNotarize": {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
    },
  },
  "makers": [
    {
      "name": "@electron-forge/maker-zip",
      "platforms": [
        "darwin",
        "win32"
      ]
    }
  ]
}