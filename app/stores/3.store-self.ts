// 登入與權限
// const sevenDay = 60 * 60 * 24 * 7;
export const StoreSelf = defineStore('StoreSelf', () => {
  /** API Token */
  const apiToken = UseEncryptCookie<string>('ss_t', '');

  /** 是否登入 */
  const isSignIn = computed(() => !! apiToken.value);

  /** 設定 Token */
  const SetToken = (_token = '') => {
    apiToken.value = _token;
  };

  /* 個人資料清除 */
  const ClearInfo = () => {
    // 清除 token
    SetToken('');
    navigateTo('/sign-in');
  };

  /** 登出 */
  const SignOut = () => {
    ClearInfo();
  };

  // ==================== FORA API ====================
  
  /** FORA API Token */
  const foraToken = UseEncryptCookie<string>('fora_t', '');
  
  /** FORA Group ID */
  const foraGroupId = UseEncryptCookie<string>('fora_gid', '');
  
  /** FORA Group Name */
  const foraGroupName = ref('');
  
  /** FORA 是否登入 */
  const isForaSignIn = computed(() => !!foraToken.value);
  
  /** 設定 FORA Token */
  const SetForaToken = (token: string, groupId: string, groupName: string = '') => {
    foraToken.value = token;
    foraGroupId.value = groupId;
    foraGroupName.value = groupName;
  };
  
  /** FORA 登出 */
  const ForaSignOut = () => {
    foraToken.value = '';
    foraGroupId.value = '';
    foraGroupName.value = '';
  };
  
  // -----------------------------------------------------------------------------------------------
  return {
    /** API Token */
    apiToken,
    /** 是否登入 */
    isSignIn,
    /** 設定 Token */
    SetToken,
    /** 登出 */
    SignOut,
    
    // FORA API
    /** FORA API Token */
    foraToken,
    /** FORA Group ID */
    foraGroupId,
    /** FORA Group Name */
    foraGroupName,
    /** FORA 是否登入 */
    isForaSignIn,
    /** 設定 FORA Token */
    SetForaToken,
    /** FORA 登出 */
    ForaSignOut,
  };
});
