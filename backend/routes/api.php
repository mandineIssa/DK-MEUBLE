<?php

use App\Http\Controllers\Api\Admin\B2bQuoteController as AdminB2bQuoteController;
use App\Http\Controllers\Api\Admin\BrandController as AdminBrandController;
use App\Http\Controllers\Api\Admin\CampaignController as AdminCampaignController;
use App\Http\Controllers\Api\Admin\CompanyController as AdminCompanyController;
use App\Http\Controllers\Api\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Api\Admin\DeliveryZoneController as AdminDeliveryZoneController;
use App\Http\Controllers\Api\Admin\InvoiceController as AdminInvoiceController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\AuthController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\MessageController as AdminMessageController;
use App\Http\Controllers\Api\Admin\PageController as AdminPageController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\MediaController as AdminMediaController;
use App\Http\Controllers\Api\Admin\QuoteController as AdminQuoteController;
use App\Http\Controllers\Api\Admin\RealizationController as AdminRealizationController;
use App\Http\Controllers\Api\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Api\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\Admin\ShowroomController as AdminShowroomController;
use App\Http\Controllers\Api\Admin\PlpSettingController as AdminPlpSettingController;
use App\Http\Controllers\Api\Admin\PromotionController as AdminPromotionController;
use App\Http\Controllers\Api\Admin\AnalyticsController as AdminAnalyticsController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\Auth\OAuthController;
use App\Http\Controllers\Api\Auth\OtpController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\QuoteController;
use App\Http\Controllers\Api\RealizationController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\ShowroomController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ContentReportController;
use App\Http\Controllers\Api\ProductChatController;
use App\Http\Controllers\Api\PushSubscriptionController;
use App\Http\Controllers\Api\HomepageController;
use App\Http\Controllers\Api\Admin\HomepageController as AdminHomepageController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Api\NavigationController;
use App\Http\Controllers\Api\Admin\NavigationController as AdminNavigationController;
use App\Http\Controllers\Api\Admin\NotificationAdminController;
use App\Http\Controllers\Api\Admin\ProductChatAdminController;
use App\Http\Controllers\Api\Admin\WishlistAdminController;
use App\Http\Controllers\Api\FooterController;
use App\Http\Controllers\Api\Admin\FooterAdminController as AdminFooterController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use Illuminate\Support\Facades\Route;

// --- Routes publiques ---
Route::get('/homepage', [HomepageController::class, 'show']);
Route::get('/homepage/sections/{id}/products', [HomepageController::class, 'sectionProducts']);
Route::post('/newsletter', [HomepageController::class, 'subscribeNewsletter'])->middleware('throttle:10,1');
Route::get('/footer', [FooterController::class, 'show']);

Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{slug}', [ServiceController::class, 'show']);
Route::post('/services/{slug}/request', [ServiceController::class, 'storeRequest'])->middleware('throttle:10,1');

Route::get('/navigation', [NavigationController::class, 'index']);
Route::post('/analytics/pageview', [AnalyticsController::class, 'pageview'])->middleware('throttle:120,1');

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);
Route::get('/categories/{slug}/filters', [CategoryController::class, 'filters']);
Route::get('/categories/{slug}/attributes', [CategoryController::class, 'attributes']);
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products/search-by-image', [ProductController::class, 'searchByImage'])
    ->middleware('throttle:10,1');
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/products/{slug}/reviews', [ReviewController::class, 'index']);
Route::post('/products/{slug}/reviews', [ReviewController::class, 'store'])
    ->middleware('throttle:10,1');
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/brands/{slug}', [BrandController::class, 'show']);
Route::get('/showrooms', [ShowroomController::class, 'index']);
Route::get('/showrooms/{id}', [ShowroomController::class, 'show']);
Route::get('/settings', [SettingController::class, 'index']);
Route::get('/pages/{pageKey}', [PageController::class, 'show']);
Route::get('/realizations', [RealizationController::class, 'index']);
Route::get('/promotions', [PromotionController::class, 'index']);
Route::get('/promotions/{id}', [PromotionController::class, 'show']);

Route::get('/cart', [CartController::class, 'show']);
Route::post('/cart', [CartController::class, 'add']);
Route::patch('/cart', [CartController::class, 'update']);
Route::delete('/cart', [CartController::class, 'remove']);
Route::get('/delivery-zones', [CheckoutController::class, 'zones']);
Route::get('/checkout/options', [CheckoutController::class, 'options']);
Route::post('/checkout', [CheckoutController::class, 'store'])->middleware('throttle:10,1');
Route::get('/orders/{reference}', [OrderController::class, 'show']);

Route::middleware('throttle:5,1')->group(function () {
    Route::post('/quotes', [QuoteController::class, 'store']);
    Route::post('/contact', [ContactController::class, 'store']);
});

Route::post('/content-reports', [ContentReportController::class, 'store'])->middleware('throttle:5,60');
Route::get('/push/vapid-public-key', [PushSubscriptionController::class, 'vapidPublicKey']);

// --- Auth client V2 (OTP) ---
Route::prefix('auth')->group(function () {
    Route::post('/request-otp', [OtpController::class, 'requestOtp'])
        ->middleware(app()->environment('local') ? 'throttle:15,10' : 'throttle:3,10');
    Route::post('/verify-otp', [OtpController::class, 'verifyOtp'])
        ->middleware('throttle:10,1');

    Route::get('/oauth/providers', [OAuthController::class, 'providers']);
    Route::get('/oauth/{provider}/redirect', [OAuthController::class, 'redirect']);
    Route::get('/oauth/{provider}/callback', [OAuthController::class, 'callback']);
});

// --- Espace client (token Sanctum) ---
Route::middleware(['auth:sanctum', 'customer'])->prefix('customer')->group(function () {
    Route::get('/me', [CustomerController::class, 'me']);
    Route::patch('/me', [CustomerController::class, 'updateProfile']);
    Route::post('/company', [CustomerController::class, 'registerCompany']);
    Route::post('/logout', [CustomerController::class, 'logout']);
    Route::get('/orders', [OrderController::class, 'customerIndex']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{productId}', [WishlistController::class, 'destroy']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::get('/notification-preferences', [NotificationController::class, 'preferences']);
    Route::put('/notification-preferences', [NotificationController::class, 'updatePreferences']);
    Route::post('/push-subscriptions', [PushSubscriptionController::class, 'store']);
    Route::post('/product-chats', [ProductChatController::class, 'open'])->middleware('throttle:20,1');
    Route::get('/product-chats/{id}/messages', [ProductChatController::class, 'messages']);
    Route::post('/product-chats/{id}/messages', [ProductChatController::class, 'send'])->middleware('throttle:30,1');
});

// --- Authentification admin ---
Route::post('/admin/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);

    Route::post('/categories/seed-suggested', [AdminCategoryController::class, 'seedSuggested']);
    Route::patch('/categories/reorder', [AdminCategoryController::class, 'reorder']);
    Route::get('/categories-settings', [AdminCategoryController::class, 'settings']);
    Route::put('/categories-settings', [AdminCategoryController::class, 'updateSettings']);
    Route::apiResource('categories', AdminCategoryController::class)->except(['show']);
    Route::post('/categories/{category}/image', [AdminCategoryController::class, 'uploadImage']);
    Route::post('/categories/{category}/attributes', [AdminCategoryController::class, 'storeAttribute']);
    Route::delete('/categories/{category}/attributes/{attribute}', [AdminCategoryController::class, 'destroyAttribute']);

    Route::get('/products/export', [AdminProductController::class, 'export']);
    Route::get('/products/import-template', [AdminProductController::class, 'importTemplate']);
    Route::post('/products/import', [AdminProductController::class, 'import']);
    Route::apiResource('products', AdminProductController::class)->except(['show']);
    Route::post('/products/{product}/images', [AdminProductController::class, 'storeImage']);
    Route::patch('/products/{product}/images/reorder', [AdminProductController::class, 'reorderImages']);
    Route::patch('/products/{product}/images/{image}', [AdminProductController::class, 'updateImage']);
    Route::delete('/products/{product}/images/{image}', [AdminProductController::class, 'destroyImage']);

    Route::get('/{type}/{id}/media', [AdminMediaController::class, 'index'])
        ->whereIn('type', ['categories', 'brands', 'realizations', 'services', 'showrooms']);
    Route::post('/{type}/{id}/media', [AdminMediaController::class, 'store'])
        ->whereIn('type', ['categories', 'brands', 'realizations', 'services', 'showrooms']);
    Route::patch('/{type}/{id}/media/reorder', [AdminMediaController::class, 'reorder'])
        ->whereIn('type', ['categories', 'brands', 'realizations', 'services', 'showrooms']);
    Route::patch('/media/{medium}', [AdminMediaController::class, 'update']);
    Route::delete('/media/{medium}', [AdminMediaController::class, 'destroy']);

    Route::apiResource('brands', AdminBrandController::class)->except(['show']);
    Route::post('/brands/{brand}/logo', [AdminBrandController::class, 'uploadLogo']);

    Route::apiResource('showrooms', AdminShowroomController::class)->except(['show']);

    Route::get('/orders/export', [AdminOrderController::class, 'export']);
    Route::get('/orders/settings', [AdminOrderController::class, 'settings']);
    Route::put('/orders/settings', [AdminOrderController::class, 'updateSettings']);
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
    Route::get('/orders/{order}/receipt', [AdminOrderController::class, 'receipt']);
    Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

    Route::apiResource('delivery-zones', AdminDeliveryZoneController::class)->except(['show']);

    Route::get('/quotes', [AdminQuoteController::class, 'index']);
    Route::patch('/quotes/{quote}', [AdminQuoteController::class, 'updateStatus']);

    Route::get('/messages', [AdminMessageController::class, 'index']);
    Route::patch('/messages/{message}', [AdminMessageController::class, 'updateStatus']);

    Route::get('/customers', [AdminCustomerController::class, 'index']);
    Route::get('/customers/{customer}', [AdminCustomerController::class, 'show']);
    Route::patch('/customers/{customer}', [AdminCustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [AdminCustomerController::class, 'destroy']);
    Route::get('/wishlists', [WishlistAdminController::class, 'index']);

    Route::apiResource('companies', AdminCompanyController::class);
    Route::post('/companies/{company}/customers', [AdminCompanyController::class, 'attachCustomer']);

    Route::apiResource('b2b-quotes', AdminB2bQuoteController::class);

    Route::get('/invoices', [AdminInvoiceController::class, 'index']);
    Route::post('/invoices', [AdminInvoiceController::class, 'store']);
    Route::patch('/invoices/{invoice}', [AdminInvoiceController::class, 'update']);
    Route::delete('/invoices/{invoice}', [AdminInvoiceController::class, 'destroy']);

    Route::get('/reviews', [AdminReviewController::class, 'index']);
    Route::patch('/reviews/{review}', [AdminReviewController::class, 'updateStatus']);
    Route::delete('/reviews/{review}', [AdminReviewController::class, 'destroy']);

    Route::get('/campaigns', [AdminCampaignController::class, 'index']);
    Route::post('/campaigns', [AdminCampaignController::class, 'store']);
    Route::post('/campaigns/{campaign}/send', [AdminCampaignController::class, 'send']);
    Route::delete('/campaigns/{campaign}', [AdminCampaignController::class, 'destroy']);

    Route::get('/promotions/settings', [AdminPromotionController::class, 'settings']);
    Route::put('/promotions/settings', [AdminPromotionController::class, 'updateSettings']);
    Route::get('/promotions', [AdminPromotionController::class, 'index']);
    Route::post('/promotions', [AdminPromotionController::class, 'store']);
    Route::put('/promotions/{promotion}', [AdminPromotionController::class, 'update']);
    Route::patch('/promotions/{promotion}/status', [AdminPromotionController::class, 'updateStatus']);
    Route::get('/promotions/{promotion}/audits', [AdminPromotionController::class, 'audits']);
    Route::delete('/promotions/{promotion}', [AdminPromotionController::class, 'destroy']);

    Route::get('/settings', [AdminSettingController::class, 'index']);
    Route::put('/settings', [AdminSettingController::class, 'update']);
    Route::post('/settings/logo', [AdminSettingController::class, 'uploadLogo']);

    Route::get('/footer', [AdminFooterController::class, 'show']);
    Route::put('/footer/settings', [AdminFooterController::class, 'updateSettings']);
    Route::post('/footer/seed', [AdminFooterController::class, 'seed']);
    Route::post('/footer/columns', [AdminFooterController::class, 'storeColumn']);
    Route::put('/footer/columns/{column}', [AdminFooterController::class, 'updateColumn']);
    Route::delete('/footer/columns/{column}', [AdminFooterController::class, 'destroyColumn']);
    Route::patch('/footer/columns/reorder', [AdminFooterController::class, 'reorderColumns']);
    Route::post('/footer/links', [AdminFooterController::class, 'storeLink']);
    Route::put('/footer/links/{link}', [AdminFooterController::class, 'updateLink']);
    Route::delete('/footer/links/{link}', [AdminFooterController::class, 'destroyLink']);
    Route::patch('/footer/links/reorder', [AdminFooterController::class, 'reorderLinks']);
    Route::post('/footer/socials', [AdminFooterController::class, 'upsertSocial']);
    Route::patch('/footer/socials/reorder', [AdminFooterController::class, 'reorderSocials']);
    Route::delete('/footer/socials/{social}', [AdminFooterController::class, 'destroySocial']);
    Route::post('/footer/payments', [AdminFooterController::class, 'storePayment']);
    Route::post('/footer/payments/{payment}', [AdminFooterController::class, 'updatePayment']);
    Route::patch('/footer/payments/reorder', [AdminFooterController::class, 'reorderPayments']);
    Route::delete('/footer/payments/{payment}', [AdminFooterController::class, 'destroyPayment']);
    Route::get('/settings/plp', [AdminPlpSettingController::class, 'show']);
    Route::put('/settings/plp', [AdminPlpSettingController::class, 'update']);

    Route::get('/analytics/visits', [AdminAnalyticsController::class, 'visits']);
    Route::get('/analytics/visits/export', [AdminAnalyticsController::class, 'export']);

    Route::get('/homepage', [AdminHomepageController::class, 'index']);
    Route::get('/newsletter-subscribers', [AdminHomepageController::class, 'newsletterIndex']);
    Route::delete('/newsletter-subscribers/{subscriber}', [AdminHomepageController::class, 'destroyNewsletter']);
    Route::post('/homepage/sections', [AdminHomepageController::class, 'storeSection']);
    Route::put('/homepage/sections/{section}', [AdminHomepageController::class, 'updateSection']);
    Route::delete('/homepage/sections/{section}', [AdminHomepageController::class, 'destroySection']);
    Route::patch('/homepage/sections/reorder', [AdminHomepageController::class, 'reorderSections']);
    Route::post('/homepage/slides', [AdminHomepageController::class, 'storeSlide']);
    Route::put('/homepage/slides/{slide}', [AdminHomepageController::class, 'updateSlide']);
    Route::delete('/homepage/slides/{slide}', [AdminHomepageController::class, 'destroySlide']);
    Route::post('/homepage/upload', [AdminHomepageController::class, 'uploadSlideImage']);
    Route::post('/homepage/items', [AdminHomepageController::class, 'storeItem']);
    Route::put('/homepage/items/{item}', [AdminHomepageController::class, 'updateItem']);
    Route::delete('/homepage/items/{item}', [AdminHomepageController::class, 'destroyItem']);
    Route::put('/homepage/settings', [AdminHomepageController::class, 'updateSettings']);

    Route::get('/services/settings', [AdminServiceController::class, 'settings']);
    Route::put('/services/settings', [AdminServiceController::class, 'updateSettings']);
    Route::get('/service-requests', [AdminServiceController::class, 'requestsIndex']);
    Route::patch('/service-requests/{serviceRequest}/status', [AdminServiceController::class, 'updateRequestStatus']);
    Route::patch('/services/reorder', [AdminServiceController::class, 'reorder']);
    Route::apiResource('services', AdminServiceController::class)->except(['show']);
    Route::post('/services/{service}/icon', [AdminServiceController::class, 'uploadIcon']);

    Route::get('/navigation', [AdminNavigationController::class, 'index']);
    Route::get('/navigation/broken-links', [AdminNavigationController::class, 'brokenLinks']);
    Route::get('/navigation/settings', [AdminNavigationController::class, 'settings']);
    Route::put('/navigation/settings', [AdminNavigationController::class, 'updateSettings']);
    Route::post('/navigation/sections', [AdminNavigationController::class, 'storeSection']);
    Route::put('/navigation/sections/{section}', [AdminNavigationController::class, 'updateSection']);
    Route::delete('/navigation/sections/{section}', [AdminNavigationController::class, 'destroySection']);
    Route::patch('/navigation/sections/reorder', [AdminNavigationController::class, 'reorderSections']);
    Route::post('/navigation/items', [AdminNavigationController::class, 'storeItem']);
    Route::put('/navigation/items/{item}', [AdminNavigationController::class, 'updateItem']);
    Route::delete('/navigation/items/{item}', [AdminNavigationController::class, 'destroyItem']);
    Route::patch('/navigation/items/reorder', [AdminNavigationController::class, 'reorderItems']);

    Route::get('/notifications/settings', [NotificationAdminController::class, 'settings']);
    Route::put('/notifications/settings', [NotificationAdminController::class, 'updateSettings']);
    Route::get('/notifications/templates', [NotificationAdminController::class, 'templates']);
    Route::post('/notifications/templates', [NotificationAdminController::class, 'storeTemplate']);
    Route::put('/notifications/templates/{template}', [NotificationAdminController::class, 'updateTemplate']);
    Route::post('/notifications/templates/preview', [NotificationAdminController::class, 'preview']);
    Route::post('/notifications/templates/seed', [NotificationAdminController::class, 'seedTemplates']);
    Route::get('/notifications/stats', [NotificationAdminController::class, 'stats']);
    Route::get('/notifications/failed', [NotificationAdminController::class, 'failed']);
    Route::post('/notifications/failed/{id}/resend', [NotificationAdminController::class, 'resend']);
    Route::get('/content-reports', [NotificationAdminController::class, 'reports']);
    Route::patch('/content-reports/{report}', [NotificationAdminController::class, 'updateReport']);
    Route::get('/product-chats', [ProductChatAdminController::class, 'index']);
    Route::get('/product-chats/{id}/messages', [ProductChatAdminController::class, 'messages']);
    Route::post('/product-chats/{id}/reply', [ProductChatAdminController::class, 'reply']);

    Route::get('/pages/{pageKey}', [AdminPageController::class, 'show']);
    Route::put('/pages/{pageKey}', [AdminPageController::class, 'update']);

    Route::apiResource('realizations', AdminRealizationController::class)->except(['show']);
    Route::post('/realizations/{realization}/image', [AdminRealizationController::class, 'storeImage']);
});
