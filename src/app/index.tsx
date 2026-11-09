import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
export default function Index() { const { loading, user, player } = useAuth(); if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>; if (!user) return <Redirect href="/(auth)/login" />; return <Redirect href={player?.profileCompleted ? '/(game)/dashboard' : '/(onboarding)/create-profile'} />; }
