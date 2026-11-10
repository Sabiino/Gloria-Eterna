import { StyleSheet, Text, View } from 'react-native';
import { gameColors } from '@/theme/gameColors';
export function InventoryEmptyState({ label }: { label: string }) { return <View style={styles.wrap}><Text style={styles.title}>NENHUM ITEM</Text><Text style={styles.copy}>Não há {label.toLowerCase()} nesta mochila.</Text></View>; }
const styles=StyleSheet.create({wrap:{padding:24,borderRadius:16,borderWidth:1,borderStyle:'dashed',borderColor:'rgba(244,188,63,.28)',alignItems:'center'},title:{color:gameColors.gold,fontWeight:'900',fontSize:12,letterSpacing:.8},copy:{color:gameColors.muted,fontSize:12,marginTop:5}});
