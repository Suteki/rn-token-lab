import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
export function useConnectivity() {
  const [isOnline, setOnline] = useState<boolean | null>(null);
  useEffect(
    () =>
      NetInfo.addEventListener(state => {
        const online =
          state.isConnected !== false && state.isInternetReachable !== false;
        setOnline(online);
        onlineManager.setOnline(online);
      }),
    [],
  );
  return isOnline;
}
