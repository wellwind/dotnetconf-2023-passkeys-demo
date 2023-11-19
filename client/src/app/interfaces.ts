export interface RegisterStartResponse {
  rp: { id: string; name: string };
  user: {
    name: string;
    id: string;
    displayName: string;
  };
  challenge: string;
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
  }>;
  timeout: number;
  attestation: 'direct' | 'enterprise' | 'indirect' | 'none';
  authenticatorSelection: {
    requireResidentKey: boolean;
    userVerification: 'discouraged' | 'preferred' | 'required';
  };
  excludeCredentials: Array<{
    id: string;
    type: 'public-key';
  }>;
  status: string;
  errorMessage: string;
}

export interface RegisterCredential {
  id: string;
  rawId: string;
  type: string;
  extensions: {
    appid?: boolean;
    credProps?: CredentialPropertiesOutput;
    hmacCreateSecret?: boolean;
  };
  response: {
    AttestationObject: string;
    clientDataJSON: string;
  };
}

export interface RegisterEndResponse {
  result: {
    publicKey: string;
    user: {
      name: string;
      id: string;
      displayName: string;
    };
    credType: string;
    aaguid: string;
    attestationCertificate: null;
    attestationCertificateChain: any[];
    credentialId: string;
    counter: number;
    status: null;
    errorMessage: null;
  };
  status: string;
  errorMessage: string;
}

export interface DeviceLoginStartResponse {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: Array<{
    type: string;
    id: string;
  }>;
  userVerification: string;
  status: string;
  errorMessage: string;
}
