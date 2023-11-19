using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Fido2NetLib;

namespace server.Models;

public class DeviceLoginEndRequest
{
    public string Username { get; set; } = "";
    public required AuthenticatorAssertionRawResponse Assertion { get; set; }
}
