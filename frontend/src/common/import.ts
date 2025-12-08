// components
import Header from "../components/layout/Header";
import { AuctionBidGraph } from "../components/product/AuctionBidGraph";
import { AuctionBidding } from "../components/product/AuctionBidding";
import ImageSearchPage from "../components/modal/ImageSearchPage";

// admin
import UserManage from "../components/admin/UserManage";
import ProductManage from "../components/admin/ProductManage";
import ReportManage from "../components/admin/ReportManage";
import PublicChatManage from "../components/admin/PublicChatManage";
import AdminDashboard from "../components/admin/AdminDashboard";
import InquiryManagement from "../components/admin/InquiryManagement";

import AROverlayModal from "../components/modal/AROverlayModal"
import MyProfile from "../components/mypage/MyProfile";
import MySellingProducts from "../components/mypage/MySellingProducts";
import MyLikes from "../components/mypage/MyLikes";
import MyReports from "../components/mypage/MyReports";
import MyProductQna from "../components/mypage/MyProductQna";
import MyInquiries from "../components/mypage/MyInquiries";
import MyStoreProfile from "../components/mypage/MyStoreProfile";
import MyPaymentHistory from "../components/mypage/MyPaymentHistory";

// pages
import Main from "../pages/main/MainPage";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ProductList from "../pages/product/ProductList";
import ProductRegister from "../pages/product/ProductForm/ProductForm";
import MyPage from "../pages/general/MyPage";
import ProductDetail from "../pages/product/ProductDetail";
import ArticleList from "../pages/article/ArticleList";
import AdminPage from '../pages/general/AdminPage';
import UserQnaForm from "../components/modal/ReportModal";
import ErrorPage from "../pages/main/ErrorPage";
import OAuth2Redirect from "../pages/auth/OAuth2Redirect";
import ProductQnA from "../components/product/ProductQnA";
import VerifyPage from "../pages/auth/VerifyPage";
import ArticleForm from "../pages/article/ArticleForm";
import ArticleDetail from "../pages/article/ArticleDetail";
import PaymentPage from "../pages/payment/PaymentPage";
import FindEmail from "../pages/auth/FindEmail";
import FindPassword from "../pages/auth/FindPassword";
import UserChat from "../components/chat/UserChat";
import PublicChat from "../components/chat/PublicChat";
import FloatingWidgets from "../components/ui/FloatingWidgets";
import NotificationModal from "../components/modal/NotificationModal";
import CartPage from "../pages/general/CartPage";
import WishlistPage from "../pages/general/WishlistPage";
import RankPage from "../pages/main/RankPage";
import SearchPage from "../pages/product/ProductList"; // Alias for readability
import UserProfilePage from "../pages/user/UserProfilePage";
import ReviewWritePage from "../pages/user/ReviewWritePage";


export {
  Header,
  AuctionBidGraph,
  AuctionBidding,
  ImageSearchPage,

  UserManage,
  ProductManage,
  ReportManage,
  AdminDashboard,
  PublicChatManage,
  InquiryManagement,

  MyProfile,
  MySellingProducts,
  MyLikes,
  MyReports,
  MyProductQna,
  MyInquiries,
  MyStoreProfile,
  MyPaymentHistory,

  Main,
  Login,
  Signup,
  ProductList,
  ProductRegister,
  MyPage,
  ProductDetail,
  ArticleList,
  AdminPage,
  UserQnaForm,
  ErrorPage,
  OAuth2Redirect,
  AROverlayModal,
  ProductQnA,
  VerifyPage,

  ArticleForm,
  ArticleDetail,
  PaymentPage,
  FindEmail,
  FindPassword,
  UserChat,
  PublicChat,
  FloatingWidgets,

  SearchPage,
  NotificationModal,
  CartPage,
  WishlistPage,
  RankPage,
  UserProfilePage,
  ReviewWritePage
};