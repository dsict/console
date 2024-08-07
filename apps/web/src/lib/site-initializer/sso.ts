import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import { useDomainStore } from '@/store/domain/domain-store';
import { pinia } from '@/store/pinia';

import { isMobile } from '@/lib/helper/cross-browsing-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { loadAuth } from '@/services/auth/authenticator/loader';



export const checkSsoAccessToken = async (store) => {
    const currentPath = window.location.pathname;
    const queryString = window.location.search;
    const params = new URLSearchParams(queryString);
    const ssoAccessToken = params.get('sso_access_token');
    const domainStore = useDomainStore(pinia);

    // only for reset-password page
    if (ssoAccessToken && currentPath === '/') {
        if (SpaceConnector.isTokenAlive) {
            try {
                const authType = domainStore.state.extendedAuthType;
                await loadAuth(authType).signOut();
                await store.dispatch('user/setIsSessionExpired', true);
            } catch (e) {
                ErrorHandler.handleError(e);
            }
        }
        if (isMobile()) store.dispatch('display/showMobileGuideModal');
        else window.location.pathname = '/reset-password';
    }
};
