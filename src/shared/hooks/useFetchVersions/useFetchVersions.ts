import { useCallback, useReducer } from "react";
import { AxiosError } from "axios";
import { ActionType, createAsyncAction, getType } from "typesafe-actions";

import { getVersions } from "api/rest";
import { Version } from "api/models";

export const {
  request: fetchRequest,
  success: fetchSuccess,
  failure: fetchFailure,
} = createAsyncAction(
  "useFetchVersions/fetch/request",
  "useFetchVersions/fetch/success",
  "useFetchVersions/fetch/failure"
)<void, Version[], AxiosError>();

type State = Readonly<{
  isFetching: boolean;
  versions?: Version[];
  fetchError?: AxiosError;
}>;

const defaultState: State = {
  isFetching: false,
  versions: undefined,
  fetchError: undefined,
};

type Action = ActionType<
  typeof fetchRequest | typeof fetchSuccess | typeof fetchFailure
>;

const initReducer = (isFetching: boolean): State => {
  return {
    ...defaultState,
    isFetching,
  };
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case getType(fetchRequest):
      return {
        ...state,
        isFetching: true,
      };
    case getType(fetchSuccess):
      return {
        ...state,
        isFetching: false,
        fetchError: undefined,
        versions: action.payload,
      };
    case getType(fetchFailure):
      return {
        ...state,
        isFetching: false,
        fetchError: action.payload,
      };
    default:
      return state;
  }
};

const delay = (t: number) => new Promise((resolve) => setTimeout(resolve, t));

export interface IState {
  versions?: Version[];
  isFetching: boolean;
  fetchError?: AxiosError;
  fetchVersions: () => void;
}

export const useFetchVersions = (
  defaultIsFetching: boolean = false
): IState => {
  const [state, dispatch] = useReducer(reducer, defaultIsFetching, initReducer);

  const fetchVersions = useCallback(() => {
    dispatch(fetchRequest());

    getVersions()
      .then(({ data }) => {
        if (
          !data.every((f) => f.status === "COMPLETED" || f.status === "ERROR")
        ) {
          dispatch(fetchSuccess(data));

          delay(3000).then(() => {
            fetchVersions();
          });
        } else {
          dispatch(fetchSuccess(data));
        }
      })
      .catch((error) => {
        dispatch(fetchFailure(error));
      });
  }, []);

  return {
    versions: state.versions,
    isFetching: state.isFetching,
    fetchError: state.fetchError,
    fetchVersions: fetchVersions,
  };
};

export default useFetchVersions;
