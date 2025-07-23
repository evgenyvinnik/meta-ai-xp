import React, { useReducer, useRef, useCallback, ComponentType } from 'react';
import styled, { keyframes } from 'styled-components';
import useMouse from 'react-use/lib/useMouse';

import {
  ADD_APP,
  DEL_APP,
  FOCUS_APP,
  MINIMIZE_APP,
  TOGGLE_MAXIMIZE_APP,
  FOCUS_ICON,
  SELECT_ICONS,
  FOCUS_DESKTOP,
  START_SELECT,
  END_SELECT,
  POWER_OFF,
  CANCEL_POWER_OFF,
} from './constants/actions';
import { FOCUSING, POWER_STATE } from './constants';
import { defaultIconState, defaultAppState, appSettings } from './apps';

// Basic type definitions for WinXP component
// Using pragmatic typing that works with existing codebase

// Basic callback types for better IntelliSense
type AppCallback = (id: any) => void;
type IconCallback = (id: any) => void;
type ComponentCallback = (component: any) => void;
type MenuItemCallback = (item: string) => void;

// Basic interfaces for core data structures
interface Size {
  width: number;
  height: number;
}

interface Offset {
  x: number;
  y: number;
}

// Flexible state interface that matches existing structure
interface WinXPState {
  apps: any[];
  nextAppID: number;
  nextZIndex: number;
  focusing: string;
  icons: any[];
  selecting: boolean;
  powerState: string;
  selectBox?: any;
}

// Flexible action type that works with existing reducer
type WinXPAction = {
  type: string;
  payload?: any;
};
import Modal from './Modal/Modal';
import Footer from './Footer/Footer';
import Windows from './Windows/Windows';
import Icons from './Icons/Icons';
import DashedBox from '../components/DashedBox/DashedBox';

const initState: WinXPState = {
  apps: defaultAppState,
  nextAppID: defaultAppState.length,
  nextZIndex: defaultAppState.length,
  focusing: FOCUSING.WINDOW,
  icons: defaultIconState,
  selecting: false,
  powerState: POWER_STATE.START,
};
const reducer = (state: WinXPState, action: WinXPAction = { type: '' }): WinXPState => {
  switch (action.type) {
    case ADD_APP:
      const app = state.apps.find(
        (_app: any) => _app.component === action.payload.component,
      );
      if (action.payload.multiInstance || !app) {
        return {
          ...state,
          apps: [
            ...state.apps,
            {
              ...action.payload,
              id: state.nextAppID,
              zIndex: state.nextZIndex,
            },
          ],
          nextAppID: state.nextAppID + 1,
          nextZIndex: state.nextZIndex + 1,
          focusing: FOCUSING.WINDOW,
        };
      }
      const apps = state.apps.map(app =>
        app.component === action.payload.component
          ? { ...app, zIndex: state.nextZIndex, minimized: false }
          : app,
      );
      return {
        ...state,
        apps,
        nextZIndex: state.nextZIndex + 1,
        focusing: FOCUSING.WINDOW,
      };
    case DEL_APP:
      if (state.focusing !== FOCUSING.WINDOW) return state;
      return {
        ...state,
        apps: state.apps.filter(app => app.id !== action.payload),
        focusing:
          state.apps.length > 1
            ? FOCUSING.WINDOW
            : state.icons.find(icon => icon.isFocus)
            ? FOCUSING.ICON
            : FOCUSING.DESKTOP,
      };
    case FOCUS_APP: {
      const apps = state.apps.map(app =>
        app.id === action.payload
          ? { ...app, zIndex: state.nextZIndex, minimized: false }
          : app,
      );
      return {
        ...state,
        apps,
        nextZIndex: state.nextZIndex + 1,
        focusing: FOCUSING.WINDOW,
      };
    }
    case MINIMIZE_APP: {
      if (state.focusing !== FOCUSING.WINDOW) return state;
      const apps = state.apps.map(app =>
        app.id === action.payload ? { ...app, minimized: true } : app,
      );
      return {
        ...state,
        apps,
        focusing: FOCUSING.WINDOW,
      };
    }
    case TOGGLE_MAXIMIZE_APP: {
      if (state.focusing !== FOCUSING.WINDOW) return state;
      const apps = state.apps.map(app =>
        app.id === action.payload ? { ...app, maximized: !app.maximized } : app,
      );
      return {
        ...state,
        apps,
        focusing: FOCUSING.WINDOW,
      };
    }
    case FOCUS_ICON: {
      const icons = state.icons.map(icon => ({
        ...icon,
        isFocus: icon.id === action.payload,
      }));
      return {
        ...state,
        focusing: FOCUSING.ICON,
        icons,
      };
    }
    case SELECT_ICONS: {
      const icons = state.icons.map(icon => ({
        ...icon,
        isFocus: action.payload.includes(icon.id),
      }));
      return {
        ...state,
        icons,
        focusing: FOCUSING.ICON,
      };
    }
    case FOCUS_DESKTOP:
      return {
        ...state,
        focusing: FOCUSING.DESKTOP,
        icons: state.icons.map(icon => ({
          ...icon,
          isFocus: false,
        })),
      };
    case START_SELECT:
      return {
        ...state,
        focusing: FOCUSING.DESKTOP,
        icons: state.icons.map(icon => ({
          ...icon,
          isFocus: false,
        })),
        selecting: action.payload,
      };
    case END_SELECT:
      return {
        ...state,
        selecting: null,
      };
    case POWER_OFF:
      return {
        ...state,
        powerState: action.payload,
      };
    case CANCEL_POWER_OFF:
      return {
        ...state,
        powerState: POWER_STATE.START,
      };
    default:
      return state;
  }
};
const WinXP: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initState);
  const ref = useRef(null);
  const mouse = useMouse(ref);
  
  const getFocusedAppId = (): number => {
    if (state.focusing !== FOCUSING.WINDOW) return -1;
    const focusedApp = [...state.apps]
      .sort((a: any, b: any) => b.zIndex - a.zIndex)
      .find((app: any) => !app.minimized);
    return focusedApp ? focusedApp.id : -1;
  };
  
  const focusedAppId = getFocusedAppId();
  const onFocusApp: AppCallback = useCallback((id: any) => {
    dispatch({ type: FOCUS_APP, payload: id });
  }, []);
  const onMaximizeWindow: AppCallback = useCallback(
    (id: any) => {
      if (focusedAppId === id) {
        dispatch({ type: TOGGLE_MAXIMIZE_APP, payload: id });
      }
    },
    [focusedAppId],
  );
  const onMinimizeWindow: AppCallback = useCallback(
    (id: any) => {
      if (focusedAppId === id) {
        dispatch({ type: MINIMIZE_APP, payload: id });
      }
    },
    [focusedAppId],
  );
  const onCloseApp: AppCallback = useCallback(
    (id: any) => {
      if (focusedAppId === id) {
        dispatch({ type: DEL_APP, payload: id });
      }
    },
    [focusedAppId],
  );
  const onMouseDownFooterApp: AppCallback = (id: any) => {
    if (focusedAppId === id) {
      dispatch({ type: MINIMIZE_APP, payload: id });
    } else {
      dispatch({ type: FOCUS_APP, payload: id });
    }
  };
  const onMouseDownIcon: IconCallback = (id: any) => {
    dispatch({ type: FOCUS_ICON, payload: id });
  };
  const onDoubleClickIcon: ComponentCallback = (component: any) => {
    const appSetting = Object.values(appSettings).find(
      (setting: any) => setting.component === component,
    );
    if (appSetting) {
      dispatch({ type: ADD_APP, payload: appSetting });
    }
  };

  const onMouseDownFooter = () => {
    dispatch({ type: FOCUS_DESKTOP });
  };
  const onClickMenuItem: MenuItemCallback = (o: string) => {
    if (o === 'Internet')
      dispatch({ type: ADD_APP, payload: appSettings['Internet Explorer'] });
    else if (o === 'Minesweeper')
      dispatch({ type: ADD_APP, payload: appSettings.Minesweeper });
    else if (o === 'My Computer')
      dispatch({ type: ADD_APP, payload: appSettings['My Computer'] });
    else if (o === 'Notepad')
      dispatch({ type: ADD_APP, payload: appSettings.Notepad });
    else if (o === 'Paint')
      dispatch({ type: ADD_APP, payload: appSettings.Paint });
    else if (o === 'Log Off')
      dispatch({ type: POWER_OFF, payload: POWER_STATE.LOG_OFF });
    else if (o === 'Turn Off Computer')
      dispatch({ type: POWER_OFF, payload: POWER_STATE.TURN_OFF });
    else
      dispatch({
        type: ADD_APP,
        payload: {
          ...appSettings.Error,
          injectProps: { message: 'C:\\\nApplication not found' },
        },
      });
  }
  function onMouseDownDesktop(e) {
    if (e.target === e.currentTarget)
      dispatch({
        type: START_SELECT,
        payload: { x: mouse.docX, y: mouse.docY },
      });
  }
  function onMouseUpDesktop(e) {
    dispatch({ type: END_SELECT });
  }
  const onIconsSelected = useCallback(
    iconIds => {
      dispatch({ type: SELECT_ICONS, payload: iconIds });
    },
    [dispatch],
  );
  function onClickModalButton(text) {
    dispatch({ type: CANCEL_POWER_OFF });
    dispatch({
      type: ADD_APP,
      payload: appSettings.Error,
    });
  }
  function onModalClose() {
    dispatch({ type: CANCEL_POWER_OFF });
  }
  return (
    <Container
      ref={ref}
      onMouseUp={onMouseUpDesktop}
      onMouseDown={onMouseDownDesktop}
      state={state.powerState}
    >
      <Icons
        icons={state.icons}
        onMouseDown={onMouseDownIcon}
        onDoubleClick={onDoubleClickIcon}
        displayFocus={state.focusing === FOCUSING.ICON}
        appSettings={appSettings}
        mouse={mouse}
        selecting={state.selecting}
        setSelectedIcons={onIconsSelected}
      />
      <DashedBox startPos={state.selecting} mouse={mouse} />
      <Windows
        apps={state.apps}
        onMouseDown={onFocusApp}
        onClose={onCloseApp}
        onMinimize={onMinimizeWindow}
        onMaximize={onMaximizeWindow}
        focusedAppId={focusedAppId}
      />
      <Footer
        apps={state.apps}
        onMouseDownApp={onMouseDownFooterApp}
        focusedAppId={focusedAppId}
        onMouseDown={onMouseDownFooter}
        onClickMenuItem={onClickMenuItem}
      />
      {state.powerState !== POWER_STATE.START && (
        <Modal
          onClose={onModalClose}
          onClickButton={onClickModalButton}
          mode={state.powerState}
        />
      )}
    </Container>
  );
}

const powerOffAnimation = keyframes`
  0% {
    filter: brightness(1) grayscale(0);
  }
  30% {
    filter: brightness(1) grayscale(0);
  }
  100% {
    filter: brightness(0.6) grayscale(1);
  }
`;
const animation = {
  [POWER_STATE.START]: '',
  [POWER_STATE.TURN_OFF]: powerOffAnimation,
  [POWER_STATE.LOG_OFF]: powerOffAnimation,
};

const Container = styled.div`
  @import url('https://fonts.googleapis.com/css?family=Noto+Sans');
  font-family: Tahoma, 'Noto Sans', sans-serif;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: url(https://i.imgur.com/Zk6TR5k.jpg) no-repeat center center fixed;
  background-size: cover;
  animation: ${({ state }) => animation[state]} 5s forwards;
  *:not(input):not(textarea) {
    user-select: none;
  }
`;

export default WinXP;
