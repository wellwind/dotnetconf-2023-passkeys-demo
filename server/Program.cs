using System.Text;
using Fido2NetLib;
using Fido2NetLib.Development;
using Fido2NetLib.Objects;
using Microsoft.AspNetCore.Mvc;
using server;
using server.Models;

var builder = WebApplication.CreateBuilder(args);

var corsPolicy = "_corsPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        name: corsPolicy,
        policy =>
        {
            policy.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod();
        }
    );
});

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var origin = new Uri("http://localhost:4200");
builder.Services.AddFido2(options =>
{
    options.ServerDomain = origin.Host;
    options.ServerName = "Passkeys Demo";
    options.Origins = new HashSet<string> { origin.AbsoluteUri };
    options.TimestampDriftTolerance = 1000;
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(corsPolicy);

app.MapPost(
        "/device-register/start",
        (IFido2 fido2, [FromBody] DeviceRegisterStartRequest request) =>
        {
            // 從資料庫找到註冊的使用者
            var user = User.Load(request.Username);
            if (String.IsNullOrEmpty(user.Username))
            {
                user.Username = request.Username;
            }

            // 建立 Fido2User 物件
            var fido2User = new Fido2User
            {
                Id = Encoding.UTF8.GetBytes(request.Username),
                DisplayName = request.Username,
                Name = request.Username,
            };

            // 建立註冊裝置的選項
            var options = fido2.RequestNewCredential(
                fido2User,
                // 使用者已經註冊過的裝置，避免裝置重複註冊
                user.StoredCredentials.Select(x => x.Descriptor).ToList(),
                AuthenticatorSelection.Default,
                AttestationConveyancePreference.None
            );

            // 儲存註冊裝置流程的的 challenge 等資訊，也可以存在 redis cache 等地方
            user.RegisterCredentialCreateOptions = options.ToJson();
            user.Save();

            return Results.Ok(options);
        }
    )
    .WithName("StartDeviceRegistration")
    .WithDescription("Starts a registration operation")
    .WithOpenApi();

app.MapPost(
        "/device-register/end",
        async (IFido2 fido2, [FromBody] DeviceRegisterEndRequest request) =>
        {
            var user = User.Load(request.Username);
            if (String.IsNullOrEmpty(user.Username))
            {
                return Results.BadRequest(new { message = "使用者不存在"});
            }

            // 從資料庫取得註冊裝置的資訊

            // 檢查 credential id 是否 unique
            IsCredentialIdUniqueToUserAsyncDelegate callback = async (args, cancellationToken) =>
            {
                return !user.IsCredentialExist(args.CredentialId);
            };
            // 驗證註冊的裝置資訊是否正確
            var options = CredentialCreateOptions.FromJson(user.RegisterCredentialCreateOptions);
            var success = await fido2.MakeNewCredentialAsync(request.Credential, options, callback);

            // 儲存註冊的裝置資訊
            user.AddCredential(
                new StoredCredential
                {
                    UserId = success.Result!.User.Id,
                    Descriptor = new PublicKeyCredentialDescriptor(success.Result!.CredentialId),
                    PublicKey = success.Result!.PublicKey,
                    UserHandle = success.Result!.User.Id,
                    SignatureCounter = success.Result!.Counter,
                    CredType = success.Result!.CredType,
                    RegDate = DateTime.UtcNow,
                    AaGuid = success.Result!.Aaguid,
                }
            );
            user.Save();

            if (success.Status == "ok")
            {
                return Results.Ok(success);
            }

            return Results.BadRequest("註冊失敗");
        }
    )
    .WithName("EndDeviceRegistration")
    .WithDescription("Ends a registration operation")
    .WithOpenApi();

app.MapPost(
    "/device-login/start",
    (IFido2 fido2, [FromBody] DeviceLoginStartRequest request) =>
    {
        // 從資料庫找到登入的使用者
        var user = User.Load(request.Username);
        if (String.IsNullOrEmpty(user.Username))
        {
           return Results.BadRequest(new { message = "使用者不存在"});
        }

        // 建立 Fido2User 物件
        var fido2User = new Fido2User
        {
            Id = Encoding.UTF8.GetBytes(request.Username),
            DisplayName = request.Username,
            Name = request.Username,
        };

        // 建立登入裝置的選項
        var options = fido2.GetAssertionOptions(
            user.StoredCredentials.Select(x => x.Descriptor).ToList(),
            UserVerificationRequirement.Discouraged
        );

        // 儲存登入裝置流程的 challenge 等資訊，也可以存在 redis cache 等地方
        user.LoginCredentialCreateOptions = options.ToJson();
        user.Save();

        return Results.Ok(options);
    }
);

app.MapPost(
    "/device-login/end",
    async (IFido2 fido2, [FromBody] DeviceLoginEndRequest request) =>
    {
        var user = User.Load(request.Username);
        if (String.IsNullOrEmpty(user.Username))
        {
            return Results.BadRequest(new { message = "使用者不存在"});
        }

        var userCredential = user.StoredCredentials.FirstOrDefault(
            x => x.Descriptor.Id.SequenceEqual(request.Assertion.Id)
        );
        if (userCredential == null)
        {
            return Results.BadRequest(new { message = "使用者不存在"});
        }

        // 檢查 user handle 是否存在
        IsUserHandleOwnerOfCredentialIdAsync callback = async (args, cancellationToken) =>
        {
            return user.IsUserHandleExist(args.UserHandle);
        };

        // 取得註冊裝置流程的 challenge 等資訊
        var options = AssertionOptions.FromJson(user.LoginCredentialCreateOptions);

        // 驗證登入的裝置資訊是否正確
        var result = await fido2.MakeAssertionAsync(
            request.Assertion,
            options,
            userCredential.PublicKey,
            userCredential.SignatureCounter,
            callback
        );

        // 驗證登入成功
        if (result.Status == "ok")
        {
            return Results.Ok(result);
        }

        return Results.BadRequest(new { message = "登入失敗"});
    }
);

app.Run();
