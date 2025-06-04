export enum permissionMap {
    USER_CREATE = 'user_create', // Create user
    USER_DELETE = 'user_delete', // Delete existing users
    USER_EDIT = 'user_edit', // Edit existing users
    USER_VIEW = 'user_view', // View existing users
    ANALYTICS_VIEW = 'analytics_view', // See Visit Analytics
    PROFILE_EDIT = 'profile_edit', // Profile Update (Existing IMGS, change links and text)
    CONTENT_CREATE = 'content_create', // Image Upload UPL
    CONTENT_DELETE = 'content_delete', // Image Upload DLT
    SETTINGS_EDIT = 'settings_edit', // Edit site settings
    SESSION_KILL = 'session_kill'
}

export const permissions = {
    admin: [
        permissionMap.USER_CREATE,
        permissionMap.USER_DELETE,
        permissionMap.USER_VIEW,
        permissionMap.USER_EDIT,
        permissionMap.ANALYTICS_VIEW,
        permissionMap.PROFILE_EDIT,
        permissionMap.CONTENT_CREATE,
        permissionMap.CONTENT_DELETE,
        permissionMap.SESSION_KILL
    ],
    user: [
        permissionMap.CONTENT_CREATE,
        permissionMap.CONTENT_DELETE,
        permissionMap.PROFILE_EDIT,
        permissionMap.USER_VIEW,
        permissionMap.ANALYTICS_VIEW
    ],
};