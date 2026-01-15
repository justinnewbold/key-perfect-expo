import { Platform } from 'react-native';
import {
  ScrollView as RNScrollView,
  FlatList as RNFlatList,
} from 'react-native';
import {
  ScrollView as GHScrollView,
  FlatList as GHFlatList,
} from 'react-native-gesture-handler';

// On web, react-native-gesture-handler's ScrollView doesn't work properly
// Use the native react-native versions on web for proper scrolling
export const ScrollView = Platform.OS === 'web' ? RNScrollView : GHScrollView;
export const FlatList = Platform.OS === 'web' ? RNFlatList : GHFlatList;
