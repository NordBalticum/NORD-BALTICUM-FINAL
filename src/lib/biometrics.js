
// /lib/biometrics.js

export const enableBiometricLogin = async (userEmail) => {
  try {
    const publicKeyOptions = {
      challenge: new Uint8Array(32),
      rp: { name: "NordBalticum" },
      user: {
        id: new TextEncoder().encode(userEmail),
        name: userEmail,
        displayName: userEmail
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      timeout: 60000,
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred"
      },
      attestation: "none"
    };

    const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
    if (credential) {
      localStorage.setItem("biometric_user", userEmail);
      return true;
    }
  } catch (err) {
    console.error("Biometric setup failed:", err);
    return false;
  }
};

export const biometricLogin = async () => {
  try {
    const userEmail = localStorage.getItem("biometric_user");
    if (!userEmail) throw new Error("No biometric user found.");

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        allowCredentials: [
          {
            id: new TextEncoder().encode(userEmail),
            type: "public-key"
          }
        ],
        userVerification: "preferred",
        timeout: 60000
      }
    });

    return userEmail;
  } catch (err) {
    console.error("Biometric login failed:", err);
    return null;
  }
};
