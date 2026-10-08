import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const DETAIL_PATH =
  /^\/(visits|meds|labs|conditions)\/[^/]+$|^\/profile$/;

const AppShell = ({ topBar }) => {
  const location = useLocation();
  const isDetail = DETAIL_PATH.test(location.pathname);

  return (
    <div className="mh-app">
      <div className="mh-phone-shell with-top-bar">
        {topBar}
        <main className={`mh-main${isDetail ? ' no-bottom-nav' : ''}`}>
          <Outlet />
        </main>
        {!isDetail && <BottomNav />}
      </div>
    </div>
  );
};

export default AppShell;
