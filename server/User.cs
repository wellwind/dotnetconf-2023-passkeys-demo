using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Fido2NetLib;
using Fido2NetLib.Development;

namespace server;

public class User
{
    private static readonly string tempPath =
        $"{Path.GetTempPath()}{Path.PathSeparator}dotnetconf-2023-passkeys-demo";

    public string Username { get; set; } = "";

    public string RegisterCredentialCreateOptions { get; set; } = "";

    public string LoginCredentialCreateOptions { get; set; } = "";

    public List<StoredCredential> StoredCredentials { get; set; } = new List<StoredCredential>();

    public void AddCredential(StoredCredential credential)
    {
        StoredCredentials.Add(credential);
    }   

    public void UpdateCounter(byte[] credentialId, uint counter)
    {
        var cred = StoredCredentials.First(c => c.Descriptor.Id.AsSpan().SequenceEqual(credentialId));
        cred.SignatureCounter = counter;
    }

    public bool IsCredentialExist(byte[] credentialId)
    {
        return StoredCredentials.Any(x => x.Descriptor.Id.AsSpan().SequenceEqual(credentialId));
    }

    public bool IsUserHandleExist(byte[] handle)
    {
        return StoredCredentials.Any(x => x.UserHandle.AsSpan().SequenceEqual(handle));
    }

    public void Save()
    {
        Console.WriteLine(tempPath);
        if (!Path.Exists(tempPath))
        {
            Directory.CreateDirectory(tempPath);
        }
        File.WriteAllText(
            $"{tempPath}/{Username}.json",
            System.Text.Json.JsonSerializer.Serialize(this)
        );
    }

    public static User Load(string username)
    {
        if (!Path.Exists(tempPath))
        {
            Directory.CreateDirectory(tempPath);
        }
        var userFilePath = $"{tempPath}/{username}.json";
        if (File.Exists(userFilePath))
        {
            return System.Text.Json.JsonSerializer.Deserialize<User>(
                File.ReadAllText(userFilePath)
            )!;
        }
        return new User();
    }
}
