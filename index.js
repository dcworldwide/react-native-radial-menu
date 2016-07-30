'use strict';

import React, {Component} from 'react';

import {
    StyleSheet,
    View,
    Animated,
    PanResponder,
    Image,
    TouchableOpacity,
    Easing
} from 'react-native';

import TimerMixin from 'react-timer-mixin';

function generateRadialPositions(count, radius, spread_angle, start_angle, xOffset, yOffset) {
    var span = spread_angle < 360 ? 1 : 0;
    var start = start_angle * Math.PI / 180;
    var rad = spread_angle * Math.PI * 2 / 360 / (count - span);
    return [...Array(count)].map((_, i) => {
        return {
            x: -Math.cos(start + rad * i) * radius + xOffset,
            y: -Math.sin(start + rad * i) * radius + yOffset,
        };
    });
};

var RadialMenu = React.createClass({

    mixins: [TimerMixin],

    isOpen: false,

    getDefaultProps: function () {
        return {
            itemRadius: 30,
            menuRadius: 100,
            spreadAngle: 360,
            startAngle: 0
        };
    },

    getInitialState: function () {

        // TODO 48? Child width
        var xOffset = this.props.width - 48 - 15
        var yOffset = 15

        var children = this.childrenToArray(this.props);

        // Define radial position of each child once expanded
        var initial_spots = generateRadialPositions(
            children.length - 1,
            this.props.menuRadius,
            this.props.spreadAngle,
            this.props.startAngle,
            xOffset,
            yOffset
        );

        // Add root child (1st)
        initial_spots.unshift({x: xOffset, y: yOffset});

        // Define animated values for each child
        var item_anims = initial_spots.map((_, i) => {
            return new Animated.ValueXY({x: xOffset, y: yOffset});
        })

        // Define animated values for each child
        var item_anims_opacity = initial_spots.map((_, i) => {
            return new Animated.Value(0);
        })

        return {
            item_spots: initial_spots,
            item_anims,
            item_anims_opacity,
            children,
            xOffset,
            yOffset,
            // selectedItem: null,
            // itemPanResponder: null,
        };
    },

    componentWillMount: function () {
        // this.setState({itemPanResponder: this.createPanResponder()});
    },

    componentWillReceiveProps(nextProps) {
        this.setState({children: this.childrenToArray(nextProps)});
    },

    // React.Children.toArray is still not exposed on RN 0.20.0-rc1
    childrenToArray: function (props) {
        let children = [];
        React.Children.forEach(props.children, (child) => {
            children.push(child)
        });
        return children;
    },

    onRootPressed: function(e) {
        e.stopPropagation();
        e.preventDefault();
        this.toggleViewState()
    },

    toggleViewState() {

        if (!this.isOpen) {

            this.props.onOpen && this.props.onOpen();

            // Expand items
            Animated.stagger(40,
                this.state.item_spots.map((spot, idx) =>
                    Animated.parallel([
                        Animated.spring(this.state.item_anims[idx], {
                            toValue: spot,
                            friction: 6,
                            tension: 80
                        }),
                        Animated.timing(this.state.item_anims_opacity[idx], {
                            toValue: 1,
                        })
                    ])
                )
            ).start();

            // If open after X seconds, close automatically
            // TODO cancel timeout if user closes before hand
            // this.setTimeout(() => {
            //     if (this.isOpen) {
            //         this.toggleViewState()
            //     }
            // }, 5000);

        } else {

            this.props.onClose && this.props.onClose();

            Animated.stagger(40,
                this.state.item_spots.map((spot, idx) =>
                    Animated.parallel([
                        Animated.spring(this.state.item_anims[idx], {
                            toValue: {x: this.state.xOffset, y: this.state.yOffset},
                            tension: 60,
                            friction: 10
                        }),
                        Animated.timing(this.state.item_anims_opacity[idx], {
                            toValue: 0,
                        })
                    ])
                )
            ).start();
        }

        this.isOpen = !this.isOpen
    },

    // itemPanListener: function (e, gestureState) {
    //     var newSelected = null;
    //     if (!this.isOpen) {
    //         newSelected = this.computeNewSelected(gestureState);
    //         if (this.state.selectedItem !== newSelected) {
    //             if (this.state.selectedItem !== null) {
    //                 var restSpot = this.state.item_spots[this.state.selectedItem];
    //                 Animated.spring(this.state.item_anims[this.state.selectedItem], {
    //                     toValue: restSpot,
    //                 }).start();
    //             }
    //             if (newSelected !== null && newSelected !== 0) {
    //                 Animated.spring(this.state.item_anims[newSelected], {
    //                     toValue: this.state.item_anims[0],
    //                 }).start();
    //             }
    //             this.state.selectedItem = newSelected;
    //         }
    //     }
    // },

    // releaseItem: function () {
    //     this.props.onClose && this.props.onClose();
    //
    //     this.state.selectedItem && !this.isOpen &&
    //     this.state.children[this.state.selectedItem].props.onSelect &&
    //     this.state.children[this.state.selectedItem].props.onSelect();
    //
    //     this.state.selectedItem = null;
    //
    //     this.state.item_anims.forEach((item, i) => {
    //         Animated.spring(item, {
    //             toValue: {x: 0, y: 0},
    //             tension: 60,
    //             friction: 10
    //         }).start();
    //     });
    // },
    //
    // createPanResponder: function () {
    //     return PanResponder.create({
    //         onStartShouldSetPanResponder: () => true,
    //
    //         // The gesture has started. gestureState.{x,y}0 will be set to zero now
    //         onPanResponderGrant: () => {
    //             this.props.onOpen && this.props.onOpen();
    //             this.isOpen = true;
    //             Animated.stagger(40,
    //                 this.state.item_spots.map((spot, idx) =>
    //                     Animated.spring(this.state.item_anims[idx], {
    //                         toValue: spot,
    //                         friction: 6,
    //                         tension: 80
    //                     })
    //                 )
    //             ).start();
    //
    //             // Make sure all items gets to initial position before we start tracking them
    //             setTimeout(() => {
    //                 this.isOpen = false
    //             }, 500);
    //         },
    //
    //         // The accumulated gesture distance since becoming responder is gestureState.d{x,y}
    //         onPanResponderMove: Animated.event(
    //             [
    //                 // ignore the native event
    //                 null,
    //                 // extract dx and dy from gestureState
    //                 {dx: this.state.item_anims[0].x, dy: this.state.item_anims[0].y}
    //                 //{dx: 0, dy: 0}
    //             ],
    //             {listener: this.itemPanListener}
    //         ),
    //         onPanResponderRelease: this.releaseItem,
    //         onPanResponderTerminate: this.releaseItem,
    //     });
    // },
    //
    // computeNewSelected: function (gestureState:Object,): ? number {
    //     var {dx, dy} = gestureState;
    //     var minDist = Infinity;
    //     var newSelected = null;
    //     var pointRadius = Math.sqrt(dx * dx + dy * dy);
    //     if (Math.abs(this.props.menuRadius - pointRadius) < this.props.menuRadius / 2) {
    //         this.state.item_spots.forEach((spot, idx) => {
    //             var delta = {x: spot.x - dx, y: spot.y - dy};
    //             var dist = delta.x * delta.x + delta.y * delta.y;
    //             if (dist < minDist) {
    //                 minDist = dist;
    //                 newSelected = idx;
    //             }
    //         });
    //     }
    //     return newSelected
    // },

    render: function() {

        const containerStyle = {
            position: 'relative',
            flex: 1,
            width: this.props.width,
            height: this.props.height,
            backgroundColor: 'transparent',
            // borderWidth: 1,
            // borderColor: 'purple'
        }

        return (
            <View style={[containerStyle, this.props.style]}>
                    {this.state.item_anims.map((_, i) => {

                        var j = this.state.item_anims.length - i - 1;
                        //var handlers = j > 0 ? {} : this.state.itemPanResponder.panHandlers;

                        if (j == 0) {
                            return (
                                <Animated.View
                                    key={i}
                                    style={{
                                    opacity: 1,
                                    transform: this.state.item_anims[j].getTranslateTransform(),
                                    position: 'absolute',
                                }}>
                                    <TouchableOpacity onPress={this.onRootPressed}>
                                        {this.isOpen
                                            ? this.props.collapseIcon
                                            : this.props.children[j]
                                        }
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        } else {
                            // {...handlers}
                            return (
                                <Animated.View
                                    key={i}
                                    style={{
                                        opacity: this.state.item_anims_opacity[j],
                                        transform: this.state.item_anims[j].getTranslateTransform(),
                                        position: 'absolute',
                                    }}>
                                    {this.state.children[j]}
                                </Animated.View>
                            );
                        }
                })}
            </View>
        );
    }
})

module.exports = RadialMenu;
