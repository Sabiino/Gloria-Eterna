import GameWorldDom from '@/components/game/game-world-dom';
import { useAuth } from '@/hooks/use-auth';
import { claimCampPlot, saveAvatarPosition, subscribeToSectorCamps } from '@/services/world/world-service';
import type { Camp, WorldCoordinate } from '@/types/game';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

export function GameWorld({ placementEnabled, onPlaced }: { placementEnabled: boolean; onPlaced: () => void }) {
  const { user, player } = useAuth(); const [camps,setCamps]=useState<Camp[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{const unsubscribe=subscribeToSectorCamps('vale-recomeco-01',next=>{setCamps(next);setError('');setLoading(false)},nextError=>{setError('Não foi possível carregar os acampamentos agora. Você ainda pode explorar o mapa.');setLoading(false)});return unsubscribe},[]);
  if(!user||loading)return <View style={s.loading}><ActivityIndicator color={colors.gold}/><Text style={s.loadingText}>Entrando no Desbrava World...</Text></View>;
  return <View style={s.world}><GameWorldDom camps={camps} currentUserId={user.uid} placementEnabled={placementEnabled} onClaim={async(position:WorldCoordinate)=>{await claimCampPlot(player?.campName??'Meu Acampamento',position);onPlaced()}} onAvatarStopped={saveAvatarPosition} dom={{style:{width:'100%',height:'100%'},scrollEnabled:false,contentInsetAdjustmentBehavior:'never'}}/>{error?<View style={s.warning}><Text style={s.warningText}>{error}</Text></View>:null}</View>;
}
const s=StyleSheet.create({world:{flex:1},loading:{flex:1,backgroundColor:colors.ink,justifyContent:'center',alignItems:'center',gap:12},loadingText:{color:colors.sand,fontWeight:'700'},warning:{position:'absolute',left:14,right:14,bottom:108,backgroundColor:'rgba(104,63,24,.92)',padding:10,borderRadius:10},warningText:{color:colors.sand,fontSize:12,textAlign:'center'}});
