using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Fido2NetLib;

namespace server.Models;

public class DeviceRegisterEndRequest
{
    public string Username { get; set; } = "";
    public required AuthenticatorAttestationRawResponse Credential { get; set; }
}
