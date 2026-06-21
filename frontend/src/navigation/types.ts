export type RootStackParamList = {
  Home: undefined;
  Builder: undefined;
  Live: undefined;
  Vision: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
