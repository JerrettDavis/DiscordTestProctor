using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using DiscordTestProctor.Domain.Constants;
using DiscordTestProctor.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;

namespace DiscordTestProctor.Web.Areas.Identity.Pages.Account;

[AllowAnonymous]
public class ExternalLoginModel : PageModel
{
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ILogger<ExternalLoginModel> _logger;
    private readonly IConfiguration _configuration;
    private readonly IUserStore<ApplicationUser> _userStore;
    private readonly IUserEmailStore<ApplicationUser> _emailStore;

    public ExternalLoginModel(
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ILogger<ExternalLoginModel> logger,
        IConfiguration configuration,
        IUserStore<ApplicationUser> userStore)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _roleManager = roleManager;
        _logger = logger;
        _configuration = configuration;
        _userStore = userStore;
        _emailStore = GetEmailStore();
    }

    [BindProperty] public InputModel Input { get; set; } = new();

    public string? ProviderDisplayName { get; set; }

    public string? ReturnUrl { get; set; }

    [TempData] public string? ErrorMessage { get; set; }

    public class InputModel
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public IActionResult OnGet()
    {
        return RedirectToPage("./Login");
    }

    public IActionResult OnPost(string provider, string? returnUrl = null)
    {
        var redirectUrl = Url.Page("./ExternalLogin", pageHandler: "Callback", values: new { returnUrl });
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
        return new ChallengeResult(provider, properties);
    }

    public async Task<IActionResult> OnGetCallbackAsync(string? returnUrl = null, string? remoteError = null)
    {
        returnUrl ??= Url.Content("~/");
        if (remoteError != null)
        {
            ErrorMessage = $"Error from external provider: {remoteError}";
            return RedirectToPage("./Login", new { ReturnUrl = returnUrl });
        }

        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null)
        {
            ErrorMessage = "Error loading external login information.";
            return RedirectToPage("./Login", new { ReturnUrl = returnUrl });
        }

        var signInResult = await _signInManager.ExternalLoginSignInAsync(
            info.LoginProvider,
            info.ProviderKey,
            isPersistent: false,
            bypassTwoFactor: true);

        if (signInResult.Succeeded)
        {
            await EnsureDiscordAdminRoleAsync(info);
            _logger.LogInformation("{Name} logged in with {LoginProvider} provider.", info.Principal.Identity?.Name, info.LoginProvider);
            return LocalRedirect(returnUrl);
        }

        if (signInResult.IsLockedOut)
        {
            return RedirectToPage("./Lockout");
        }

        ReturnUrl = returnUrl;
        ProviderDisplayName = info.ProviderDisplayName;
        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        Input = new InputModel { Email = email ?? string.Empty };
        return Page();
    }

    public async Task<IActionResult> OnPostConfirmationAsync(string? returnUrl = null)
    {
        returnUrl ??= Url.Content("~/");
        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null)
        {
            ErrorMessage = "Error loading external login information during confirmation.";
            return RedirectToPage("./Login", new { ReturnUrl = returnUrl });
        }

        if (!ModelState.IsValid)
        {
            ProviderDisplayName = info.ProviderDisplayName;
            ReturnUrl = returnUrl;
            return Page();
        }

        var user = CreateUser();
        await _userStore.SetUserNameAsync(user, Input.Email, CancellationToken.None);
        await _emailStore.SetEmailAsync(user, Input.Email, CancellationToken.None);

        var result = await _userManager.CreateAsync(user);
        if (result.Succeeded)
        {
            result = await _userManager.AddLoginAsync(user, info);
            if (result.Succeeded)
            {
                await EnsureDiscordAdminRoleAsync(info, user);
                await _signInManager.SignInAsync(user, isPersistent: false, info.LoginProvider);
                return LocalRedirect(returnUrl);
            }
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        ProviderDisplayName = info.ProviderDisplayName;
        ReturnUrl = returnUrl;
        return Page();
    }

    private ApplicationUser CreateUser()
    {
        try
        {
            return Activator.CreateInstance<ApplicationUser>()
                   ?? throw new InvalidOperationException($"Can't create an instance of '{nameof(ApplicationUser)}'.");
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Can't create an instance of '{nameof(ApplicationUser)}'. " +
                                                "Ensure that it is not an abstract class and has a parameterless constructor.", ex);
        }
    }

    private IUserEmailStore<ApplicationUser> GetEmailStore()
    {
        if (!_userManager.SupportsUserEmail)
        {
            throw new NotSupportedException("The default UI requires a user store with email support.");
        }

        return (IUserEmailStore<ApplicationUser>)_userStore;
    }

    private async Task EnsureDiscordAdminRoleAsync(ExternalLoginInfo info, ApplicationUser? user = null)
    {
        if (!string.Equals(info.LoginProvider, "Discord", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var adminIds = _configuration
                           .GetSection("Discord:AdminIds")
                           .Get<string[]>() ?? Array.Empty<string>();

        if (adminIds.Length == 0 ||
            !adminIds.Contains(info.ProviderKey, StringComparer.OrdinalIgnoreCase))
        {
            return;
        }

        user ??= await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
        if (user is null)
        {
            return;
        }

        if (!await _roleManager.RoleExistsAsync(Roles.Administrator))
        {
            await _roleManager.CreateAsync(new IdentityRole(Roles.Administrator));
        }

        if (!await _userManager.IsInRoleAsync(user, Roles.Administrator))
        {
            await _userManager.AddToRoleAsync(user, Roles.Administrator);
        }
    }
}
